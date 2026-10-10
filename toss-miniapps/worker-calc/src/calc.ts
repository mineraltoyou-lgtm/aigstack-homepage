// 직장인·알바 계산기 — 계산 로직 (근로기준법·근로자퇴직급여보장법 기준)
// 날짜는 모두 'YYYY-MM-DD' 문자열을 UTC 자정으로 해석해 시간대 오차를 없앤다.

export const MIN_WAGE_2026 = 10_320;
const DAY_MS = 86_400_000;
const WEEKS_PER_MONTH = 365 / 7 / 12; // ≈ 4.345

export function parseDate(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function ymd(t: number) {
  const d = new Date(t);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}

/** 월 단위 이동. 말일을 넘으면 그 달 말일로 맞춘다 (5/31 - 3개월 = 2/28). */
export function addMonths(t: number, months: number): number {
  const { y, m, d } = ymd(t);
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, lastDay));
}

/** start부터 end까지 꽉 채운 개월 수 */
export function fullMonthsBetween(start: number, end: number): number {
  const a = ymd(start);
  const b = ymd(end);
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  if (addMonths(start, months) > end) months -= 1;
  return Math.max(0, months);
}

// ── 주휴수당 ─────────────────────────────────────────
/** 주 소정근로 15시간 이상이면 (주 근로시간 / 40) × 8시간, 최대 8시간 */
export function weeklyHolidayHours(weekHours: number): number {
  if (weekHours < 15) return 0;
  return (Math.min(weekHours, 40) / 40) * 8;
}

export function weeklyHolidayPay(hourlyWage: number, weekHours: number) {
  const hours = weeklyHolidayHours(weekHours);
  return { hours, pay: Math.round(hours * hourlyWage), eligible: hours > 0 };
}

// ── 시급 → 월급 환산 ─────────────────────────────────
/** 주 40시간이면 (40 + 8) × 4.345 ≈ 209시간 */
export function monthlyPaidHours(weekHours: number): number {
  return Math.round((weekHours + weeklyHolidayHours(weekHours)) * WEEKS_PER_MONTH);
}

export function monthlyWage(hourlyWage: number, weekHours: number) {
  const hours = monthlyPaidHours(weekHours);
  return {
    hours,
    pay: hours * hourlyWage,
    belowMinimum: hourlyWage < MIN_WAGE_2026,
  };
}

// ── 연차 ────────────────────────────────────────────
/** 근속 n년차 만근 시 발생 연차: 15일 + 2년마다 1일, 최대 25일 */
export function annualLeaveForYear(year: number): number {
  if (year < 1) return 0;
  return Math.min(25, 15 + Math.floor((year - 1) / 2));
}

/** 입사일 기준. 1년 미만은 매월 개근 시 1일(최대 11일), 출근율 80% 이상 가정 */
export function annualLeave(hireDate: string, asOf: string) {
  const hire = parseDate(hireDate);
  const now = parseDate(asOf);
  const months = fullMonthsBetween(hire, now);
  const years = Math.floor(months / 12);
  if (years < 1) {
    return { years, months, current: Math.min(months, 11), firstYear: true };
  }
  return { years, months, current: annualLeaveForYear(years), firstYear: false };
}

// ── 퇴직금 ──────────────────────────────────────────
export interface SeveranceInput {
  hireDate: string;
  lastWorkDate: string; // 마지막 근무일
  monthlyPay: number; // 최근 월 급여(세전)
  annualBonus?: number; // 연간 상여금
  annualLeavePay?: number; // 연간 연차수당
}

/**
 * 1일 평균임금 × 30 × (재직일수 / 365).
 * 평균임금 = 퇴직일 이전 3개월 임금총액 / 그 기간 일수.
 * 상여금·연차수당은 연간 금액의 3/12를 더한다.
 */
export function severancePay(input: SeveranceInput) {
  const hire = parseDate(input.hireDate);
  const retire = parseDate(input.lastWorkDate) + DAY_MS; // 퇴직일 = 마지막 근무일 다음날
  const serviceDays = Math.round((retire - hire) / DAY_MS);
  const periodDays = Math.round((retire - addMonths(retire, -3)) / DAY_MS);
  const wageTotal =
    input.monthlyPay * 3 + ((input.annualBonus ?? 0) * 3) / 12 + ((input.annualLeavePay ?? 0) * 3) / 12;
  const dailyAvg = wageTotal / periodDays;
  return {
    serviceDays,
    periodDays,
    dailyAvg,
    pay: Math.round(dailyAvg * 30 * (serviceDays / 365)),
    eligible: serviceDays >= 365,
  };
}

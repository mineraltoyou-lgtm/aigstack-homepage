import { describe, expect, it } from 'vitest';
import {
  addMonths,
  annualLeave,
  annualLeaveForYear,
  monthlyPaidHours,
  monthlyWage,
  parseDate,
  severancePay,
  weeklyHolidayPay,
} from './calc';

describe('주휴수당', () => {
  it('주 40시간 최저시급이면 8시간분', () => {
    expect(weeklyHolidayPay(10_320, 40)).toEqual({ hours: 8, pay: 82_560, eligible: true });
  });
  it('주 20시간이면 4시간분', () => {
    expect(weeklyHolidayPay(10_320, 20).pay).toBe(41_280);
  });
  it('주 15시간 미만은 없음', () => {
    expect(weeklyHolidayPay(10_320, 14.5).eligible).toBe(false);
  });
  it('40시간 초과해도 최대 8시간', () => {
    expect(weeklyHolidayPay(10_000, 52).hours).toBe(8);
  });
});

describe('월급 환산', () => {
  it('주 40시간 = 209시간, 2026 최저월급 2,156,880원', () => {
    expect(monthlyPaidHours(40)).toBe(209);
    expect(monthlyWage(10_320, 40).pay).toBe(2_156_880);
  });
  it('최저시급 미만 경고', () => {
    expect(monthlyWage(10_000, 40).belowMinimum).toBe(true);
  });
});

describe('연차', () => {
  it('1년 미만은 개근 개월 수만큼', () => {
    expect(annualLeave('2025-01-01', '2025-06-15')).toMatchObject({ current: 5, firstYear: true });
  });
  it('1년 미만은 최대 11일', () => {
    expect(annualLeave('2025-01-01', '2025-12-31').current).toBe(11);
  });
  it('1년이면 15일, 3년이면 16일', () => {
    expect(annualLeave('2024-01-01', '2025-01-01').current).toBe(15);
    expect(annualLeave('2023-01-01', '2026-01-01').current).toBe(16);
  });
  it('최대 25일', () => {
    expect(annualLeaveForYear(30)).toBe(25);
  });
});

describe('퇴직금', () => {
  it('말일 기준 월 이동', () => {
    expect(addMonths(parseDate('2026-05-31'), -3)).toBe(parseDate('2026-02-28'));
  });
  it('3년 근속, 월 300만원', () => {
    const r = severancePay({ hireDate: '2023-01-01', lastWorkDate: '2025-12-31', monthlyPay: 3_000_000 });
    expect(r.serviceDays).toBe(1096);
    expect(r.periodDays).toBe(92);
    expect(r.eligible).toBe(true);
    expect(r.pay).toBe(8_812_388);
  });
  it('1년 미만은 대상 아님', () => {
    expect(severancePay({ hireDate: '2025-03-01', lastWorkDate: '2025-12-31', monthlyPay: 2_500_000 }).eligible).toBe(false);
  });
});

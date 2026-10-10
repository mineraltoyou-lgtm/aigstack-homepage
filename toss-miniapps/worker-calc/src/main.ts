import './style.css';
import { annualLeave, annualLeaveForYear, MIN_WAGE_2026, monthlyWage, severancePay, weeklyHolidayPay } from './calc';
import { mountBanner } from './ads';

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const hrs = (n: number) => `${Number(n.toFixed(1)).toLocaleString('ko-KR')}시간`;

const input = (k: string) => document.querySelector<HTMLInputElement>(`[data-k="${k}"]`)!;
const num = (k: string) => Number(input(k).value.replace(/[^\d.]/g, '')) || 0;
const out = (k: string) => document.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

function result(main: string, label: string, rows: [string, string][] = [], msg?: string, kind: 'warn' | 'info' = 'warn') {
  return `
    <p class="label">${label}</p>
    <p class="big">${main}</p>
    ${rows.map(([a, b]) => `<div class="row"><span>${a}</span><span>${b}</span></div>`).join('')}
    ${msg ? `<p class="${kind}">${msg}</p>` : ''}`;
}

const today = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const yearsAgo = (n: number) => new Date(today.getFullYear() - n, today.getMonth(), today.getDate());

input('l-hire').value = iso(yearsAgo(1));
input('l-asof').value = iso(today);
input('s-hire').value = iso(yearsAgo(3));
input('s-last').value = iso(today);

const renderers: Record<string, () => void> = {
  holiday() {
    const r = weeklyHolidayPay(num('h-wage'), num('h-hours'));
    out('holiday').innerHTML = r.eligible
      ? result(won(r.pay), '일주일 주휴수당', [
          ['주휴시간', hrs(r.hours)],
          ['한 달(4.345주) 기준', won(r.pay * (365 / 7 / 12))],
        ])
      : result('0원', '일주일 주휴수당', [], '주 15시간 미만으로 일하면 주휴수당이 없어요.');
  },
  monthly() {
    const wage = num('m-wage');
    const r = monthlyWage(wage, num('m-hours'));
    out('monthly').innerHTML = result(
      won(r.pay),
      '주휴수당 포함 월급(세전)',
      [
        ['월 유급시간', hrs(r.hours)],
        ['연봉 환산', won(r.pay * 12)],
      ],
      r.belowMinimum && wage > 0 ? `2026년 최저시급(${won(MIN_WAGE_2026)})보다 낮아요.` : undefined,
    );
  },
  leave() {
    const hire = input('l-hire').value;
    const asOf = input('l-asof').value;
    if (!hire || !asOf || hire > asOf) {
      out('leave').innerHTML = result('-', '발생 연차', [], '입사일과 기준일을 확인해 주세요.');
      return;
    }
    const r = annualLeave(hire, asOf);
    out('leave').innerHTML = r.firstYear
      ? result(`${r.current}일`, '지금까지 발생한 연차 (1년 미만)', [
          ['근속', `${r.months}개월`],
          ['1년 채우면', `${annualLeaveForYear(1)}일 새로 발생`],
        ], '1년 미만은 한 달 개근할 때마다 1일씩, 최대 11일이에요.', 'info')
      : result(`${r.current}일`, `올해 연차 (근속 ${r.years}년차)`, [
          ['다음 해', `${annualLeaveForYear(r.years + 1)}일`],
          ['최대', '25일'],
        ], '전년도 출근율 80% 이상 기준이에요.', 'info');
  },
  severance() {
    const hireDate = input('s-hire').value;
    const lastWorkDate = input('s-last').value;
    if (!hireDate || !lastWorkDate || hireDate > lastWorkDate) {
      out('severance').innerHTML = result('-', '예상 퇴직금', [], '입사일과 마지막 근무일을 확인해 주세요.');
      return;
    }
    const r = severancePay({
      hireDate,
      lastWorkDate,
      monthlyPay: num('s-pay'),
      annualBonus: num('s-bonus'),
      annualLeavePay: num('s-leavepay'),
    });
    out('severance').innerHTML = result(
      r.eligible ? won(r.pay) : '0원',
      '예상 퇴직금(세전)',
      [
        ['재직일수', `${r.serviceDays.toLocaleString('ko-KR')}일`],
        ['1일 평균임금', won(r.dailyAvg)],
      ],
      r.eligible ? undefined : '1년 이상 일해야 퇴직금을 받을 수 있어요.',
    );
  },
};

function renderAll() {
  Object.values(renderers).forEach((fn) => fn());
}

// 금액 칸은 입력하면서 천 단위 콤마
document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]').forEach((el) => {
  el.addEventListener('input', () => {
    const digits = el.value.replace(/\D/g, '');
    el.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
  });
});

document.querySelectorAll('input').forEach((el) => el.addEventListener('input', renderAll));

document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab!;
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) =>
      b.setAttribute('aria-selected', String(b === btn)),
    );
    document.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== tab));
  });
});

renderAll();
mountBanner(document.getElementById('ad-banner')!);

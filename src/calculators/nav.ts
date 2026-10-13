import { accrual, amount, days, divide, rate, ratio, usd, xirr, type MathStep } from "./finance";
export interface NavPeriod { date: string; returnBps: number; crystallize: boolean }
export interface NavInput { start: string; openingNav: number; shares: number; hwmPerShare: number; managementBps: number; performanceBps: number; hurdleBps: number; periods: NavPeriod[] }
export interface NavRow { date: string; opening: number; pnl: number; management: number; performanceAccrued: number; performancePaid: number; nav: number; perShare: number; hwm: number; reason: string }
export function calculateNav(input: NavInput) {
  if (amount(input.openingNav) <= 0 || amount(input.hwmPerShare) < 0 || !Number.isSafeInteger(input.shares) || input.shares <= 0 || input.shares > 1_000_000_000) throw new Error("Opening NAV and whole shares must be positive; HWM cannot be negative.");
  amount(input.hwmPerShare * input.shares);
  rate(input.managementBps, 0, 2000); rate(input.performanceBps, 0, 9000); rate(input.hurdleBps, 0, 5000);
  if (!input.periods.length || input.periods.length > 12) throw new Error("Use 1-12 valuation periods.");
  let last = input.start, nav = input.openingNav, outstanding = 0, hwm = input.hwmPerShare, anchorDate = input.start, anchorNav = nav;
  let managementTotal = 0, paidTotal = 0; const rows: NavRow[] = []; const steps: MathStep[] = [];
  for (const period of input.periods) {
    rate(period.returnBps, -10000, 10000);
    if (typeof period.crystallize !== "boolean" || days(last, period.date) <= 0 || days(input.start, period.date) > 365 * 30) throw new Error("Period dates must increase and remain within 30 years.");
    const opening = nav, priorAccrual = outstanding, grossBase = amount(nav + priorAccrual);
    const pnl = ratio(Math.max(grossBase, 0), period.returnBps);
    const management = accrual(Math.max(opening, 0), input.managementBps, days(last, period.date));
    const prePerformance = amount(grossBase + pnl - management);
    const hwmTotal = amount(hwm * input.shares);
    const hurdleTotal = amount(anchorNav + accrual(Math.max(anchorNav, 0), input.hurdleBps, days(anchorDate, period.date)));
    const openingAnchor = anchorNav;
    const threshold = Math.max(hwmTotal, hurdleTotal, openingAnchor);
    const earned = ratio(Math.max(0, prePerformance - threshold), input.performanceBps);
    const paid = period.crystallize ? earned : 0;
    const reason = prePerformance <= anchorNav ? "No positive return since crystallization" : prePerformance <= hwmTotal ? "Below high-water mark" : prePerformance <= hurdleTotal ? "Below hard hurdle" : input.performanceBps === 0 ? "Performance fee rate is zero" : period.crystallize ? "Crystallized and assumed paid" : "Accrued; not crystallized";
    nav = amount(prePerformance - earned); outstanding = period.crystallize ? 0 : earned;
    const perShare = divide(BigInt(nav), BigInt(input.shares));
    if (period.crystallize) { hwm = Math.max(hwm, perShare); anchorDate = period.date; anchorNav = nav; }
    rows.push({ date: period.date, opening, pnl, management, performanceAccrued: outstanding, performancePaid: paid, nav, perShare, hwm, reason });
    const add = (label: string, formula: string, lp: number, gp = 0, remaining = nav) => steps.push({ date: period.date, label, formula, lp, gp, remaining });
    add("Gross market P&L", `${usd(grossBase)} gross assets x ${period.returnBps / 100}%`, pnl, 0, amount(opening + pnl));
    add("Management fee", `${usd(Math.max(opening, 0))} opening net NAV x ${input.managementBps / 100}% x ${days(last, period.date)}/365; assumed paid each period`, -management, management, amount(prePerformance - priorAccrual));
    add("Performance fee", `max(0, ${usd(prePerformance)} - max(HWM ${usd(hwmTotal)}, hard hurdle ${usd(hurdleTotal)}, opening anchor ${usd(openingAnchor)})) x ${input.performanceBps / 100}%; reverse prior ${usd(priorAccrual)}, replace with ${usd(earned)}; paid ${usd(paid)}`, priorAccrual - earned, paid);
    add("Net NAV", `Gross before performance ${usd(prePerformance)} - total current incentive accrual ${usd(earned)}. Prior accrual is replaced, not charged twice.`, nav);
    managementTotal = amount(managementTotal + management); paidTotal = amount(paidTotal + paid); last = period.date;
  }
  const ending = rows.at(-1)!;
  const grossPnl = rows.reduce((s, r) => amount(s + r.pnl), 0);
  const control = amount(input.openingNav + grossPnl - managementTotal - paidTotal - outstanding - ending.nav);
  return { rows, steps, nav: ending.nav, perShare: ending.perShare, hwm: ending.hwm, performancePaid: paidTotal, performanceAccrued: outstanding, managementTotal, irr: xirr([{ date: input.start, cents: -input.openingNav }, { date: ending.date, cents: ending.nav }]), control };
}

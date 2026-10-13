import { accrual, amount, days, divide, paymentToTarget, rate, ratio, total, usd, xirr, type CashFlow, type MathStep } from "./finance";
export interface Deal { id: string; capital: number; proceeds: number; exit: string }
export interface CarryTier { hurdleBps: number | null; carryBps: number }
export interface WaterfallInput { style: "european" | "american"; start: string; preferredBps: number; catchupBps: number; managementBps: number; clawback: boolean; tiers: CarryTier[]; deals: Deal[] }
export interface Distribution { date: string; deal: string; capital: number; preferred: number; lpProfit: number; gpCarry: number; fees: number; clawback: number; gross: number }
export interface WaterfallResult { rows: Distribution[]; steps: MathStep[]; capital: number; lpTotal: number; gpCarry: number; fees: number; feeUnpaid: number; clawbackDue: number; clawbackPaid: number; unreturnedCapital: number; unpaidPreferred: number; lpIrr: number | null; moic: number; flows: CashFlow[]; control: number }
export function validateWaterfall(input: WaterfallInput) {
  if (!["european", "american"].includes(input.style) || typeof input.clawback !== "boolean") throw new Error("Invalid waterfall style or clawback option.");
  rate(input.preferredBps, 0, 5000); rate(input.managementBps, 0, 2000); rate(input.catchupBps);
  if (!input.deals.length || input.deals.length > 12 || !input.tiers.length || input.tiers.length > 5) throw new Error("Use 1-12 deals and 1-5 carry tiers.");
  let prior = input.preferredBps;
  input.tiers.forEach((t, i) => {
    rate(t.carryBps, 0, 9000);
    if (t.hurdleBps === null) { if (i !== input.tiers.length - 1) throw new Error("Only the last carry tier can be unlimited."); }
    else { rate(t.hurdleBps, 0, 10000); if (t.hurdleBps <= prior) throw new Error("IRR thresholds must increase and exceed preferred return."); prior = t.hurdleBps; }
  });
  if (input.tiers.at(-1)!.hurdleBps !== null) throw new Error("The final carry tier must be unlimited.");
  if (input.catchupBps > 0 && input.catchupBps <= input.tiers[0].carryBps) throw new Error("Catch-up must be zero or greater than first-tier carry.");
  const ids = new Set<string>();
  input.deals.forEach(d => {
    if (!/^[A-Za-z0-9-]{1,24}$/.test(d.id) || ids.has(d.id)) throw new Error("Each deal requires a unique short ID."); ids.add(d.id);
    if (amount(d.capital) <= 0 || amount(d.proceeds) < 0 || days(input.start, d.exit) <= 0 || days(input.start, d.exit) > 365 * 30) throw new Error("Deal capital must be positive, proceeds nonnegative and exit within 30 years of start.");
  });
  total(input.deals.map(d => d.capital)); total(input.deals.map(d => d.proceeds));
}
type Pool = { remaining: number; prefNumerator: bigint; prefPaid: number; catchGross: number; catchGP: number; date: string; flows: CashFlow[] };
function compute(input: WaterfallInput): WaterfallResult {
  const deals = [...input.deals].sort((a, b) => a.exit.localeCompare(b.exit) || a.id.localeCompare(b.id));
  const capital = total(deals.map(d => d.capital));
  const pool = (c: number): Pool => ({ remaining: c, prefNumerator: 0n, prefPaid: 0, catchGross: 0, catchGP: 0, date: input.start, flows: [{ date: input.start, cents: -c }] });
  const whole = pool(capital); const rows: Distribution[] = []; const steps: MathStep[] = []; let feeUnpaid = 0; let unpaidPreferred = 0; let unreturnedCapital = 0;
  for (const deal of deals) {
    const p = input.style === "european" ? whole : pool(deal.capital);
    p.prefNumerator += BigInt(p.remaining) * BigInt(input.preferredBps) * BigInt(days(p.date, deal.exit)); p.date = deal.exit;
    const feeDue = accrual(deal.capital, input.managementBps, days(input.start, deal.exit));
    const row: Distribution = { date: deal.exit, deal: deal.id, capital: 0, preferred: 0, lpProfit: 0, gpCarry: 0, fees: Math.min(feeDue, deal.proceeds), clawback: 0, gross: deal.proceeds };
    feeUnpaid = amount(feeUnpaid + feeDue - row.fees);
    let cash = deal.proceeds - row.fees;
    const step = (label: string, formula: string, lp: number, gp: number) => steps.push({ date: deal.exit, label: `${deal.id}: ${label}`, formula, lp, gp, remaining: cash });
    step("Management fee", `${usd(deal.capital)} x ${(input.managementBps / 100).toFixed(2)}% x ${days(input.start, deal.exit)}/365; paid limited to exit cash`, 0, row.fees);
    row.capital = Math.min(cash, p.remaining); p.remaining -= row.capital; cash -= row.capital;
    p.flows.push({ date: deal.exit, cents: row.capital });
    step("Return of capital", `min(distributable cash, ${usd(p.remaining + row.capital)} outstanding capital)`, row.capital, 0);
    const prefDue = Math.max(0, divide(p.prefNumerator, 3650000n));
    row.preferred = Math.min(cash, prefDue); cash -= row.preferred; p.prefPaid += row.preferred; p.prefNumerator -= BigInt(row.preferred) * 3650000n;
    p.flows.push({ date: deal.exit, cents: row.preferred });
    step("Preferred return", `Simple ACT/365 on outstanding capital; min(cash, ${usd(prefDue)} accrued preference)`, row.preferred, 0);
    if (cash && input.catchupBps) {
      const r = input.tiers[0].carryBps, q = input.catchupBps;
      const gap = BigInt(r) * BigInt(p.prefPaid + p.catchGross) - BigInt(p.catchGP) * 10000n;
      const needed = gap > 0n ? amount(Number((gap + BigInt(q - r) - 1n) / BigInt(q - r))) : 0;
      const paid = Math.min(cash, needed), gp = ratio(paid, q), lp = paid - gp;
      cash -= paid; row.gpCarry += gp; row.lpProfit += lp; p.catchGross += paid; p.catchGP += gp;
      p.flows.push({ date: deal.exit, cents: lp });
      step("GP catch-up", `Required gross = max(0, (carry x (preferred paid + prior catch-up) - prior catch-up GP)/(catch-up rate - carry)); GP ${q / 100}%`, lp, gp);
    }
    for (let i = 0; i < input.tiers.length; i++) {
      const tier = input.tiers[i];
      const lpNeeded = tier.hurdleBps === null ? null : paymentToTarget(p.flows, deal.exit, tier.hurdleBps);
      // Find the smallest whole-cent distribution reaching the dated LP IRR target.
      let paid = cash;
      if (lpNeeded !== null) {
        let lo = 0, hi = cash;
        if (cash - ratio(cash, tier.carryBps) >= lpNeeded) {
          while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (m - ratio(m, tier.carryBps) >= lpNeeded) hi = m; else lo = m + 1; }
          paid = lo;
        }
      }
      const gp = ratio(paid, tier.carryBps), lp = paid - gp;
      cash -= paid; row.gpCarry += gp; row.lpProfit += lp; p.flows.push({ date: deal.exit, cents: lp });
      step(`Residual tier ${i + 1}`, `${100 - tier.carryBps / 100}/${tier.carryBps / 100} LP/GP; ${tier.hurdleBps === null ? "unlimited" : `LP annualized IRR target ${tier.hurdleBps / 100}%; additional LP cash ${usd(lpNeeded!)}`}; dated cash-flow target, not a profit percentage band`, lp, gp);
      if (!cash) break;
    }
    if (input.style === "american") { unreturnedCapital += p.remaining; unpaidPreferred += Math.max(0, divide(p.prefNumerator, 3650000n)); }
    rows.push(row);
  }
  if (input.style === "european") { unreturnedCapital = whole.remaining; unpaidPreferred = Math.max(0, divide(whole.prefNumerator, 3650000n)); }
  const lpTotal = total(rows.map(r => r.capital + r.preferred + r.lpProfit));
  const gpCarry = total(rows.map(r => r.gpCarry)); const fees = total(rows.map(r => r.fees));
  const flows = [{ date: input.start, cents: -capital }, ...rows.map(r => ({ date: r.date, cents: r.capital + r.preferred + r.lpProfit }))];
  return { rows, steps, capital, lpTotal, gpCarry, fees, feeUnpaid, clawbackDue: 0, clawbackPaid: 0, unreturnedCapital, unpaidPreferred, lpIrr: xirr(flows), moic: lpTotal / capital, flows, control: total(rows.map(r => r.gross)) - lpTotal - gpCarry - fees };
}
export function calculateWaterfall(input: WaterfallInput): WaterfallResult {
  validateWaterfall(input); const result = compute(input);
  if (input.style === "american") {
    const reference = compute({ ...input, style: "european" });
    result.clawbackDue = Math.max(0, result.gpCarry - reference.gpCarry);
    if (input.clawback && result.clawbackDue) {
      const returned = result.clawbackDue; result.clawbackPaid = returned; result.lpTotal += returned; result.gpCarry -= returned;
      const last = result.rows.at(-1)!; last.clawback = returned; last.gpCarry -= returned;
      result.flows.at(-1)!.cents += returned;
      result.steps.push({ date: last.date, label: "Final fund clawback", formula: `max(0, deal-by-deal carry paid - whole-fund carry entitlement); ${usd(returned)} assumed recoverable from GP, no tax or escrow adjustments`, lp: returned, gp: -returned, remaining: 0 });
      result.lpIrr = xirr(result.flows); result.moic = result.lpTotal / result.capital;
      const capitalRecovery = Math.min(result.unreturnedCapital, returned);
      result.unreturnedCapital -= capitalRecovery;
      result.unpaidPreferred = Math.max(0, result.unpaidPreferred - (returned - capitalRecovery));
    }
  }
  return result;
}

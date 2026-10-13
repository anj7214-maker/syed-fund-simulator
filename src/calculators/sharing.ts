import { ENGINE_VERSION, usd, percent } from "./finance";
import { defaultCase, validateCase, evaluateCase, terminalValue, type CalculatorCase } from "./model";
export function canonicalCase(value: CalculatorCase): CalculatorCase {
  if (!value || value.version !== 1 || !["waterfall", "nav"].includes(value.kind)) throw new Error("Unsupported calculator snapshot version or type.");
  const defaults = defaultCase();
  const w = value.kind === "waterfall" ? value.waterfall : defaults.waterfall;
  const p = value.kind === "waterfall" ? value.property : defaults.property;
  const n = value.kind === "nav" ? value.nav : defaults.nav;
  const clean: CalculatorCase = { version: 1, kind: value.kind,
    waterfall: { style: w.style, start: w.start, preferredBps: w.preferredBps, catchupBps: w.catchupBps, managementBps: w.managementBps, clawback: w.clawback, tiers: w.tiers.map(t => ({ hurdleBps: t.hurdleBps, carryBps: t.carryBps })), deals: w.deals.map(d => ({ id: d.id, capital: d.capital, proceeds: d.proceeds, exit: d.exit })) },
    property: { dealId: p.dealId, noi: p.noi, occupancyBps: p.occupancyBps, capBps: p.capBps, debt: p.debt, interestBps: p.interestBps },
    nav: { start: n.start, openingNav: n.openingNav, shares: n.shares, hwmPerShare: n.hwmPerShare, managementBps: n.managementBps, performanceBps: n.performanceBps, hurdleBps: n.hurdleBps, periods: n.periods.map(p => ({ date: p.date, returnBps: p.returnBps, crystallize: p.crystallize })) } };
  const last = clean.waterfall.deals.find(d => d.id === clean.property.dealId);
  if (last) last.proceeds = terminalValue(clean.property, clean.waterfall.start, last.exit).proceeds;
  return validateCase(clean);
}
export function encodeCase(input: CalculatorCase) {
  const body = JSON.stringify({ engine: ENGINE_VERSION, input: canonicalCase(input) });
  return btoa(body).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function decodeCase(token: string): CalculatorCase {
  if (token.length > 16000 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new Error("Shared case is too large or invalid.");
  try {
    const parsed = JSON.parse(atob(token.replaceAll("-", "+").replaceAll("_", "/")));
    if (parsed.engine !== ENGINE_VERSION) throw new Error("This snapshot uses a different calculation version.");
    return canonicalCase(parsed.input);
  } catch (e) { throw new Error(e instanceof Error ? `Cannot open snapshot: ${e.message}` : "Invalid snapshot."); }
}
const escape = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export function reportHtml(input: CalculatorCase) {
  const full = canonicalCase(input), output = evaluateCase(full);
  const model = output.kind === "nav" ? { version: full.version, kind: full.kind, nav: full.nav } : { version: full.version, kind: full.kind, waterfall: full.waterfall, property: full.property };
  const metric = output.kind === "waterfall" ? output.result.lpTotal : output.result.nav;
  const irr = output.kind === "waterfall" ? output.result.lpIrr : output.result.irr;
  const table = (heads: string[], rows: string[][]) => `<table><thead><tr>${heads.map(h => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escape(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>FundOps Lab - LP Scenario Sanity Report</title><style>body{font:14px Arial,sans-serif;color:#142637;margin:36px;line-height:1.5}h1{font-size:26px}h2{font-size:18px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:11px}th{background:#152e48;color:white;text-align:left}th,td{padding:8px;border:1px solid #bdc7d0}tr{break-inside:avoid}.notice{border:1px solid #748797;padding:14px}pre{white-space:pre-wrap;font-size:11px}footer{margin-top:28px;font-size:11px}@media print{button{display:none}thead{display:table-header-group}@page{size:A4;margin:15mm}body{margin:0}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>LP Scenario Sanity Report</h1><p>FundOps Lab / Synthetic scenario / Engine ${ENGINE_VERSION}</p><div class="notice">Illustrative analysis, not investment advice, an appraisal, an audit opinion or a posted NAV. Assumptions are user editable; verify against the governing agreement. No institutional endorsement. Founded by Syed Ali Jafri ACSI ICA.</div><h2>${output.kind === "waterfall" ? "LP distribution" : "Closing net NAV"}: ${usd(metric)}</h2><p>Annualized dated return: ${percent(irr)}. Distribution / NAV control residual: ${usd(output.result.control)}.</p><h2>Risk & sensitivity</h2>${table(["Scenario", output.kind === "waterfall" ? "Terminal property equity" : "NAV", "Dated IRR", output.kind === "waterfall" ? "LP proceeds" : "Ending NAV", "Change"], output.sensitivity.map(s => [s.label, usd(s.nav), percent(s.irr), usd(s.lp), usd(s.delta)]))}<h2>Mathematical trace</h2>${table(["Date", "Step", "Calculation", "LP / NAV", "GP", "Cash / NAV remaining"], output.steps.map(s => [s.date, s.label, s.formula, usd(s.lp), usd(s.gp), usd(s.remaining)]))}<h2>Cash flows / valuation timeline</h2>${output.kind === "waterfall" ? table(["Date", "LP cash flow"], output.result.flows.map(f => [f.date, usd(f.cents)])) : table(["Date", "Gross P&L", "Management", "Incentive paid", "Incentive accrued", "Net NAV", "HWM / share", "Treatment"], output.result.rows.map(r => [r.date, usd(r.pnl), usd(r.management), usd(r.performancePaid), usd(r.performanceAccrued), usd(r.nav), usd(r.hwm), r.reason]))}<h2>Assumptions & limitations</h2><p>Money settles to cents with integer arithmetic; rates use whole basis points. Dated IRR is a numerical annualized calculation, not a cent-exact amount.</p><p>${output.kind === "waterfall" ? "All LP capital is contributed at inception. Preferred return is simple ACT/365 on outstanding capital, not compounded. GP co-investment, tax, escrow, interim rent distributions and debt amortization are excluded. Management fees use original deal capital and are withheld at each exit. Final property proceeds derive from NOI/cap rate less debt and simple accrued interest. The American clawback is a full-recovery terminal comparison with the same whole-fund model, not an LPA-specific legal entitlement." : "One fixed-unit investor pool; no subscriptions, redemptions, equalization or investor classes. Management fees are paid each period. The hard hurdle runs from the last crystallization; total incentive accrual is recalculated and replaced at each mark. Crystallization assumes fee payment and raises HWM only to a higher post-fee NAV/share. Negative NAV or undefined IRR requires review."}</p><h2>Reproducible source inputs</h2><pre>${escape(JSON.stringify(model, null, 2))}</pre><footer>FundOps Lab / SYNTHETIC SCENARIO - NOT A CLIENT REPORT / Engine ${ENGINE_VERSION}</footer></body></html>`;
}

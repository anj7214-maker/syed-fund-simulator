import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const cache = new Map();
async function compile(name) {
  if (cache.has(name)) return cache.get(name);
  let source = await readFile(new URL(`../src/calculators/${name}.ts`, import.meta.url), "utf8");
  for (const dependency of [...source.matchAll(/from "\.\/(\w+)"/g)].map(m => m[1])) source = source.replaceAll(`"./${dependency}"`, JSON.stringify(await compile(dependency)));
  const url = "data:text/javascript;base64," + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64");
  cache.set(name, url); return url;
}
const f = await import(await compile("finance"));
const w = await import(await compile("waterfall"));
const n = await import(await compile("nav"));
const m = await import(await compile("model"));
const s = await import(await compile("sharing"));
let count = 0;
const test = (name, run) => { run(); count++; console.log(`PASS ${name}`); };
const flat = { style: "european", start: "2025-01-01", preferredBps: 800, catchupBps: 10000, managementBps: 0, clawback: true, tiers: [{ hurdleBps: null, carryBps: 2000 }], deals: [{ id: "Deal-1", capital: 10000000, proceeds: 12500000, exit: "2026-01-01" }] };
test("Money parser preserves 0.29 without floating-point multiplication", () => assert.equal(f.parseMoney("0.29"), 29));
test("Money rejects sub-cent values, scientific notation and unsafe ranges", () => { for (const v of ["1.001", "1e6", "Infinity", "10000000000000"]) assert.throws(() => f.parseMoney(v)); });
test("Half-up ratio settles positive and negative cents symmetrically", () => { assert.equal(f.ratio(1, 5000), 1); assert.equal(f.ratio(-1, 5000), -1); });
test("ACT365 uses actual leap-day count", () => { assert.equal(f.days("2024-01-01", "2025-01-01"), 366); assert.equal(f.accrual(3650000, 10000, 366), 3660000); });
test("Impossible calendar dates rejected", () => assert.throws(() => f.day("2026-02-30")));
test("One-year dated IRR independently equals 10%", () => assert.ok(Math.abs(f.xirr([{ date: "2025-01-01", cents: -10000000 }, { date: "2026-01-01", cents: 11000000 }]) - .1) < 1e-10));
test("Non-conventional and absent-positive IRR are not fabricated", () => { assert.equal(f.xirr([{ date: "2025-01-01", cents: -100 }, { date: "2026-01-01", cents: 50 }, { date: "2027-01-01", cents: -10 }]), null); assert.equal(f.xirr([{ date: "2025-01-01", cents: -100 }, { date: "2026-01-01", cents: 0 }]), null); });
test("Independent 8% pref / 20% carry fixture returns 120k LP / 5k GP", () => { const r = w.calculateWaterfall(flat); assert.equal(r.lpTotal, 12000000); assert.equal(r.gpCarry, 500000); assert.equal(r.rows[0].preferred, 800000); assert.equal(r.control, 0); });
test("Insufficient proceeds only recover capital; no carry or imaginary pref", () => { const r = w.calculateWaterfall({ ...flat, deals: [{ ...flat.deals[0], proceeds: 5000000 }] }); assert.equal(r.gpCarry, 0); assert.equal(r.rows[0].preferred, 0); assert.equal(r.unreturnedCapital, 5000000); assert.equal(r.control, 0); });
test("Zero exit produces no money or defined positive IRR", () => { const r = w.calculateWaterfall({ ...flat, deals: [{ ...flat.deals[0], proceeds: 0 }] }); assert.equal(r.lpTotal, 0); assert.equal(r.lpIrr, null); });
test("Management fee is deducted once and reconciles gross exit", () => { const r = w.calculateWaterfall({ ...flat, managementBps: 200 }); assert.equal(r.fees, 200000); assert.equal(r.control, 0); assert.equal(r.lpTotal + r.gpCarry + r.fees, 12500000); });
test("Fee shortfall remains unpaid rather than creating negative distributions", () => { const r = w.calculateWaterfall({ ...flat, managementBps: 200, deals: [{ ...flat.deals[0], proceeds: 10 }] }); assert.equal(r.fees, 10); assert.equal(r.feeUnpaid, 199990); assert.equal(r.control, 0); });
test("12% / 18% IRR tiers use dated LP targets, not profit slices", () => {
  const r = w.calculateWaterfall({ ...flat, deals: [{ ...flat.deals[0], proceeds: 15000000 }], tiers: [{ hurdleBps: 1200, carryBps: 2000 }, { hurdleBps: 1800, carryBps: 3000 }, { hurdleBps: null, carryBps: 5000 }] });
  const t1 = r.steps.find(s => s.label.endsWith("Residual tier 1")); const t2 = r.steps.find(s => s.label.endsWith("Residual tier 2"));
  assert.equal(t1.lp, 400000); assert.equal(t1.gp, 100000); assert.equal(t2.lp, 600000); assert.equal(t2.gp, 257143); assert.equal(r.control, 0);
});
test("American early carry is clawed back against final whole-fund result", () => {
  const input = { ...flat, style: "american", deals: [{ id: "Winner", capital: 10000000, proceeds: 15000000, exit: "2026-01-01" }, { id: "Loss", capital: 10000000, proceeds: 5000000, exit: "2027-01-01" }] };
  const no = w.calculateWaterfall({ ...input, clawback: false }); const yes = w.calculateWaterfall(input);
  assert.equal(no.gpCarry, 1000000); assert.equal(yes.clawbackDue, 1000000); assert.equal(yes.clawbackPaid, 1000000); assert.equal(yes.gpCarry, 0); assert.equal(yes.lpTotal, 20000000); assert.equal(yes.control, 0); assert.ok(yes.rows.at(-1).gpCarry < 0);
});
test("Declining tier thresholds and impossible catch-up rejected", () => { assert.throws(() => w.calculateWaterfall({ ...flat, catchupBps: 1000 })); assert.throws(() => w.calculateWaterfall({ ...flat, tiers: [{ carryBps: 2000, hurdleBps: 700 }, { carryBps: 2000, hurdleBps: null }] })); });
test("Duplicate deal IDs and exits before investment rejected", () => { assert.throws(() => w.calculateWaterfall({ ...flat, deals: [...flat.deals, ...flat.deals] })); assert.throws(() => w.calculateWaterfall({ ...flat, deals: [{ ...flat.deals[0], exit: "2024-01-01" }] })); });
test("Permutation does not change waterfall economics", () => { const base = m.defaultCase().waterfall; assert.deepEqual(w.calculateWaterfall(base), w.calculateWaterfall({ ...base, deals: [...base.deals].reverse() })); });
const nav = { start: "2025-01-01", openingNav: 100000000, shares: 10000, hwmPerShare: 10000, managementBps: 0, performanceBps: 2000, hurdleBps: 0, periods: [{ date: "2026-01-01", returnBps: 1000, crystallize: true }] };
test("NAV 10% return / 20% incentive pays 20k and leaves 1.08m", () => { const r = n.calculateNav(nav); assert.equal(r.nav, 108000000); assert.equal(r.performancePaid, 2000000); assert.equal(r.hwm, 10800); assert.equal(r.control, 0); });
test("Uncrystallized incentive lowers NAV but does not raise HWM or count as paid", () => { const r = n.calculateNav({ ...nav, periods: [{ ...nav.periods[0], crystallize: false }] }); assert.equal(r.nav, 108000000); assert.equal(r.performancePaid, 0); assert.equal(r.performanceAccrued, 2000000); assert.equal(r.hwm, 10000); });
test("Repeated incentive accrual replaces liability rather than double charging", () => { const r = n.calculateNav({ ...nav, periods: [{ ...nav.periods[0], crystallize: false }, { date: "2027-01-01", returnBps: 1000, crystallize: false }] }); assert.equal(r.nav, 116800000); assert.equal(r.performanceAccrued, 4200000); assert.equal(r.control, 0); });
test("Crystallization resets fee base and protects HWM next period", () => { const r = n.calculateNav({ ...nav, periods: [...nav.periods, { date: "2027-01-01", returnBps: 1000, crystallize: true }] }); assert.equal(r.nav, 116640000); assert.equal(r.performancePaid, 4160000); assert.equal(r.hwm, 11664); assert.equal(r.control, 0); });
test("Below-HWM and negative-return cases earn no performance fee", () => { assert.equal(n.calculateNav({ ...nav, hwmPerShare: 12000 }).performancePaid, 0); const r = n.calculateNav({ ...nav, periods: [{ ...nav.periods[0], returnBps: -1000 }] }); assert.equal(r.performancePaid, 0); assert.equal(r.hwm, 10000); });
test("Hard hurdle applies before incentive", () => { const r = n.calculateNav({ ...nav, hurdleBps: 1500 }); assert.equal(r.performancePaid, 0); assert.match(r.rows[0].reason, /hurdle/); });
test("Invalid shares and backwards dates rejected", () => { assert.throws(() => n.calculateNav({ ...nav, shares: 0 })); assert.throws(() => n.calculateNav({ ...nav, periods: [{ ...nav.periods[0], date: nav.start }] })); });
test("NAV accrual reverses after a market decline", () => { const r = n.calculateNav({ ...nav, periods: [{ ...nav.periods[0], crystallize: false }, { date: "2027-01-01", returnBps: -2000, crystallize: false }] }); assert.equal(r.performanceAccrued, 0); assert.equal(r.nav, 88000000); assert.equal(r.control, 0); });
test("Property equity links NOI, cap rate, debt and exact debt-interest days", () => { const p = m.defaultCase().property; const v = m.terminalValue(p, "2025-01-01", "2026-01-01"); assert.equal(v.valuation, 400000000); assert.equal(v.interest, 6000000); assert.equal(v.nav, 294000000); });
test("Every property downside reduces LP proceeds; base ties exactly", () => { const r = m.evaluateCase(m.defaultCase()); assert.equal(r.sensitivity[0].lp, r.result.lpTotal); for (const s of r.sensitivity.slice(1)) { assert.ok(s.lp <= r.result.lpTotal); assert.ok(Number.isFinite(s.nav)); } });
test("Changing exit order never silently moves the property source", () => { const input = m.defaultCase(); const original = m.evaluateCase(input).value; input.waterfall.deals[0].exit = "2032-01-01"; assert.deepEqual(m.evaluateCase(input).value, original); });
test("Negative property equity produces zero exit cash, not negative distribution", () => { const input = m.defaultCase(); input.property.debt = 1000000000; const r = m.evaluateCase(input); assert.ok(r.value.nav < 0); assert.equal(r.value.proceeds, 0); assert.equal(r.result.control, 0); });
test("NAV sensitivity changes final return and recomputes fees", () => { const input = { ...m.defaultCase(), kind: "nav" }; const r = m.evaluateCase(input); assert.equal(r.sensitivity[0].nav, r.result.nav); assert.ok(r.sensitivity.at(-1).nav < r.result.nav); });
test("Shared snapshots round-trip with canonical, recalculated inputs", () => { const input = m.defaultCase(); const decoded = s.decodeCase(s.encodeCase(input)); assert.deepEqual(decoded, s.canonicalCase(input)); assert.equal(decoded.waterfall.deals.at(-1).proceeds, m.evaluateCase(input).value.proceeds); });
test("Unknown properties, including email fields, are removed before sharing", () => { const input = { ...m.defaultCase(), email: "private@example.test" }; assert.ok(!JSON.stringify(s.decodeCase(s.encodeCase(input))).includes("private@example")); });
test("Saving one calculator neither exposes nor depends on inactive model edits", () => { const input = m.defaultCase(); input.kind = "nav"; input.waterfall.catchupBps = 2000; input.property.noi = 45678; const saved = s.decodeCase(s.encodeCase(input)); assert.deepEqual(saved.nav, input.nav); assert.equal(saved.property.noi, m.defaultCase().property.noi); assert.notEqual(saved.waterfall.catchupBps, input.waterfall.catchupBps); });
test("Malformed links, unknown versions and oversized payloads rejected", () => { assert.throws(() => s.decodeCase("!bad")); assert.throws(() => s.decodeCase("A".repeat(16001))); assert.throws(() => s.decodeCase(btoa(JSON.stringify({ engine: "other", input: m.defaultCase() })))); });
test("Snapshot model version and kind are validated before canonicalization", () => { for (const input of [{ ...m.defaultCase(), version: 99 }, { ...m.defaultCase(), kind: "unsupported" }]) { assert.throws(() => m.validateCase(input)); assert.throws(() => s.canonicalCase(input)); assert.throws(() => s.decodeCase(btoa(JSON.stringify({ engine: f.ENGINE_VERSION, input })))); } });
test("PDF preview contains branded limitations, sensitivity and mathematical trace", () => { const html = s.reportHtml(m.defaultCase()); for (const text of ["FundOps Lab", "Synthetic", "Risk &amp; sensitivity", "Mathematical trace", "Reproducible source inputs"]) { if (text === "Risk &amp; sensitivity") assert.ok(html.includes("Risk & sensitivity")); else assert.ok(html.includes(text)); } });
test("Calculator engines are pure and leave input models unchanged", () => { const input = m.defaultCase(); const before = JSON.stringify(input); for (let i = 0; i < 5; i++) m.evaluateCase(input); assert.equal(JSON.stringify(input), before); });
for (const style of ["american", "european"]) {
  test(`${style} cent conservation across 100 small deterministic samples`, () => { for (let i = 0; i < 100; i++) { const r = w.calculateWaterfall({ ...flat, style, managementBps: i, deals: [{ ...flat.deals[0], capital: 100 + i, proceeds: 70 + i * 7 }, { id: "Deal-2", capital: 80 + i, proceeds: i * 3, exit: "2027-01-01" }] }); assert.equal(r.control, 0); assert.equal(r.lpTotal + r.gpCarry + r.fees, r.rows.reduce((s, d) => s + d.gross, 0)); assert.ok(Number.isSafeInteger(r.lpTotal)); } });
}
const routeSource = await readFile(new URL("../src/workspaces/navigation.ts", import.meta.url), "utf8");
const routes = await import("data:text/javascript;base64," + Buffer.from(ts.transpileModule(routeSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString("base64"));
test("Calculator route resolves independently from operational routes", () => { assert.equal(routes.resolveRoute("/calculators"), "calculators"); assert.equal(routes.resolveRoute("/hedge-fund"), "hedge-fund"); assert.equal(routes.resolveRoute("/real-estate"), "real-estate"); });
const ui = await readFile(new URL("../src/calculators/CalculatorDesk.tsx", import.meta.url), "utf8");
assert.ok(!ui.includes("fundStore") && !ui.includes("realEstate/store"));
const visitorSource = await readFile(new URL("../src/components/VisitorGate.tsx", import.meta.url), "utf8");
const visitorCode = ts.transpileModule(visitorSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText.replaceAll('"react"', JSON.stringify(import.meta.resolve("react"))).replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve("react/jsx-runtime")));
const { VisitorGate } = await import("data:text/javascript;base64," + Buffer.from(visitorCode).toString("base64"));
const { createElement } = await import("react"); const { renderToString } = await import("react-dom/server");
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
try {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
  test("Save/share boundary displays existing registration for an unregistered visitor", () => { const html = renderToString(createElement(VisitorGate, null, "GATED_SHARE_ACTIONS")); assert.ok(html.includes("Full name") && html.includes("Email address") && html.includes("Privacy Notice")); assert.ok(!html.includes("GATED_SHARE_ACTIONS")); });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => JSON.stringify({ noticeVersion: "2026-10-12", registrationId: "synthetic-test-only" }) } });
  test("Existing visitor registration permits free saved/report actions, not verified authentication", () => assert.ok(renderToString(createElement(VisitorGate, null, "GATED_SHARE_ACTIONS")).includes("GATED_SHARE_ACTIONS")));
} finally { if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor); else delete globalThis.localStorage; }
console.log(`${count} calculator checks passed; no workspace-store imports.`);

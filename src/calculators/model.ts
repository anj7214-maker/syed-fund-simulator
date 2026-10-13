import { accrual, amount, days, divide, rate, ratio, type MathStep } from "./finance";
import { calculateWaterfall, type WaterfallInput } from "./waterfall";
import { calculateNav, type NavInput } from "./nav";
export interface PropertyInput { dealId: string; noi: number; occupancyBps: number; capBps: number; debt: number; interestBps: number }
export interface CalculatorCase { version: 1; kind: "waterfall" | "nav"; waterfall: WaterfallInput; property: PropertyInput; nav: NavInput }
export const defaultCase = (): CalculatorCase => ({ version: 1, kind: "waterfall",
  waterfall: { style: "european", start: "2026-01-01", preferredBps: 800, catchupBps: 10000, managementBps: 150, clawback: true, tiers: [{ hurdleBps: 1200, carryBps: 2000 }, { hurdleBps: 1800, carryBps: 3000 }, { hurdleBps: null, carryBps: 5000 }], deals: [{ id: "Deal-A", capital: 100000000, proceeds: 180000000, exit: "2028-01-01" }, { id: "Property-B", capital: 150000000, proceeds: 276000000, exit: "2030-01-01" }] },
  property: { dealId: "Property-B", noi: 20000000, occupancyBps: 9500, capBps: 500, debt: 100000000, interestBps: 600 },
  nav: { start: "2026-01-01", openingNav: 100000000, shares: 10000, hwmPerShare: 10000, managementBps: 200, performanceBps: 2000, hurdleBps: 500, periods: [{ date: "2026-03-31", returnBps: 500, crystallize: false }, { date: "2026-06-30", returnBps: -300, crystallize: false }, { date: "2026-12-31", returnBps: 800, crystallize: true }] }
});
export function terminalValue(p: PropertyInput, start: string, exit: string) {
  rate(p.occupancyBps, 0, 10000); rate(p.capBps, 1, 10000); rate(p.interestBps, 0, 10000);
  if (amount(p.noi) < 0 || amount(p.debt) < 0) throw new Error("NOI and debt cannot be negative.");
  const valuation = divide(BigInt(p.noi) * 10000n, BigInt(p.capBps));
  const interest = accrual(p.debt, p.interestBps, days(start, exit));
  return { valuation, interest, nav: amount(valuation - p.debt - interest), proceeds: Math.max(0, amount(valuation - p.debt - interest)) };
}
export function evaluateCase(input: CalculatorCase) {
  if (input.version !== 1 || !["waterfall", "nav"].includes(input.kind)) throw new Error("Unsupported calculator snapshot.");
  if (input.kind === "nav") {
    const result = calculateNav(input.nav);
    const sensitivity = [0, -500, -1000, -2000].map(shock => {
      const periods = input.nav.periods.map((p, i) => i === input.nav.periods.length - 1 ? { ...p, returnBps: Math.max(-10000, p.returnBps + shock) } : p);
      const stressed = calculateNav({ ...input.nav, periods });
      const applied = periods.at(-1)!.returnBps - input.nav.periods.at(-1)!.returnBps;
      return { label: shock === 0 ? "Base case" : `Final-period return ${applied / 100} percentage points`, nav: stressed.nav, irr: stressed.irr, lp: stressed.nav, delta: stressed.nav - result.nav };
    });
    return { kind: "nav" as const, result, sensitivity, steps: result.steps };
  }
  const last = input.waterfall.deals.find(d => d.id === input.property.dealId);
  if (!last) throw new Error("Choose a property-linked exit from the deal timeline.");
  rate(input.property.occupancyBps, 1, 10000);
  rate(input.property.capBps, 1, 5000); rate(input.property.interestBps, 0, 5000);
  const value = terminalValue(input.property, input.waterfall.start, last.exit);
  const terms = { ...input.waterfall, deals: input.waterfall.deals.map(d => d.id === last.id ? { ...d, proceeds: value.proceeds } : d) };
  const result = calculateWaterfall(terms);
  const shocks = [{ label: "Base case", cap: 0, occ: 0, interest: 0 }, { label: "Cap rate +100 bps", cap: 100, occ: 0, interest: 0 }, { label: "Occupancy -10 percentage points", cap: 0, occ: -1000, interest: 0 }, { label: "Interest rate +200 bps", cap: 0, occ: 0, interest: 200 }, { label: "Combined downside", cap: 100, occ: -1000, interest: 200 }];
  const sensitivity = shocks.map(s => {
    const occupancyBps = Math.max(0, input.property.occupancyBps + s.occ);
    const p = { ...input.property, noi: ratio(input.property.noi, occupancyBps, input.property.occupancyBps), occupancyBps, capBps: input.property.capBps + s.cap, interestBps: input.property.interestBps + s.interest };
    const v = terminalValue(p, terms.start, last.exit);
    const stressed = calculateWaterfall({ ...terms, deals: terms.deals.map(d => d.id === last.id ? { ...d, proceeds: v.proceeds } : d) });
    const label = s.occ !== 0 && occupancyBps - input.property.occupancyBps !== s.occ ? `${s.label} (floored at 0%)` : s.label;
    return { label, nav: v.nav, irr: stressed.lpIrr, lp: stressed.lpTotal, delta: stressed.lpTotal - result.lpTotal };
  });
  const sourceSteps: MathStep[] = [{ date: last.exit, label: "Property terminal NAV", formula: `NOI / cap rate - debt - debt x interest rate x ACT/365; operating rental distributions, amortization, tax and sale costs excluded`, lp: value.nav, gp: 0, remaining: value.proceeds }];
  return { kind: "waterfall" as const, result, sensitivity, steps: [...sourceSteps, ...result.steps], terms, value };
}
export function validateCase(input: CalculatorCase) {
  if (!input || input.version !== 1 || !["waterfall", "nav"].includes(input.kind)) throw new Error("Unsupported calculator snapshot version or type.");
  // Validate both models before accepting a shared snapshot, including the hidden tab.
  evaluateCase({ ...input, kind: "waterfall" }); evaluateCase({ ...input, kind: "nav" });
  return input;
}

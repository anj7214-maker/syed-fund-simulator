import { recalculate } from "../engine/recalc";
import { sampleHoldings, sampleTrades, sampleFx, sampleInvestors, sampleActivities, sampleAccruals, sampleDerivatives, sampleCorporateActions, sampleCashRecon, samplePositionRecon, sampleFundSetup } from "../data/sampleData";
import { actors, calculate, createBook, projection, propertyCarrying, type RETx } from "../realEstate/engine";
import type { AssetWorkspace } from "./navigation";

export interface DemoNode { name: string; before: number; after: number }
export interface HomeDemo { source: string; inputLabel: string; nodes: DemoNode[]; beforeNav: number; afterNav: number; impact: number; explanation: string; sources: string[]; balanced: boolean }

export function getHomeDemo(asset: AssetWorkspace, movement: number): HomeDemo {
  if (!Number.isFinite(movement) || Math.abs(movement) > 12) throw new Error("Demo movement must be between -12% and 12%.");
  if (asset === "hedge-fund") {
    const inputs = structuredClone({ holdings: sampleHoldings, trades: sampleTrades, fxRates: sampleFx, investors: sampleInvestors, activities: sampleActivities, accruals: sampleAccruals, derivatives: sampleDerivatives, corporateActions: sampleCorporateActions, cashRecon: sampleCashRecon, positionRecon: samplePositionRecon, managementFeePct: sampleFundSetup.managementFeePct, performanceFeePct: sampleFundSetup.performanceFeePct });
    const before = recalculate(inputs);
    const source = inputs.holdings.find(h => h.ticker === "MSFT")!;
    const price = Math.round(source.marketPrice * (1 + movement / 100) * 100) / 100;
    const after = recalculate({ ...inputs, holdings: inputs.holdings.map(h => h.id === source.id ? { ...h, marketPrice: price } : h) });
    const oldHolding = before.holdings.find(h => h.id === source.id)!;
    const newHolding = after.holdings.find(h => h.id === source.id)!;
    return {
      source: "MSFT / USD", inputLabel: "MSFT price movement (%)",
      nodes: [{ name: "Source price", before: source.marketPrice, after: price }, { name: "Holding value", before: oldHolding.marketValue, after: newHolding.marketValue }, { name: "Unrealized P&L", before: oldHolding.unrealized, after: newHolding.unrealized }, { name: "Fund NAV", before: before.netAssets, after: after.netAssets }],
      beforeNav: before.netAssets, afterNav: after.netAssets, impact: Math.round((after.netAssets - before.netAssets) * 100) / 100,
      balanced: Math.abs(after.grossAssets - after.liabilities - after.netAssets) < .01,
      explanation: "A price move changes the holding value and unrealized P&L. Fund NAV also includes recalculated management and performance fees; this is not a NAV release.",
      sources: [`${source.quantity.toLocaleString("en-US")} shares from the synthetic MSFT holding. Market value = quantity x price x FX rate.`, "Unrealized P&L uses the existing holding cost and FX treatment.", "Fund NAV = total assets - liabilities using the existing NAV engine, including its fee assumptions. These are fresh sample inputs, not your workspace book."],
    };
  }
  const book = createBook(); const before = calculate(book); const property = book.properties[0];
  const carrying = propertyCarrying(book, property.id);
  const value = Math.round(carrying * (1 + movement / 100));
  const proposed: RETx = { id: "HOME-VALUATION", entityId: property.entityId, propertyId: property.id, kind: "Valuation", amount: value, date: book.asOf, reference: property.id, description: "Home valuation demonstration", status: "Draft", maker: actors.Analyst, reason: "Isolated synthetic Home preview", evidence: "SYNTHETIC/HomeAppraisal" };
  book.transactions.push(proposed);
  const projected = projection(book);
  if (projected.errors.length) throw new Error(projected.errors.join(" "));
  const after = calculate(projected.book);
  const oldSpv = before.entityRows.find(r => r.entity.id === property.entityId)!;
  const newSpv = after.entityRows.find(r => r.entity.id === property.entityId)!;
  return {
    source: `${property.name} / USD`, inputLabel: "Property valuation movement (%)",
    nodes: [{ name: "Property valuation", before: carrying / 100, after: value / 100 }, { name: "SPV net assets", before: oldSpv.netAssets / 100, after: newSpv.netAssets / 100 }, { name: "Fund earnings", before: before.pnl / 100, after: after.pnl / 100 }, { name: "Projected NAV", before: before.nav / 100, after: after.nav / 100 }],
    beforeNav: before.nav / 100, afterNav: after.nav / 100, impact: (after.nav - before.nav) / 100,
    balanced: after.assets - after.liabilities === after.nav && after.investors.reduce((s, i) => s + i.closing, 0) === after.nav,
    explanation: "A valuation proposal flows from property to SPV, earnings and consolidated projected NAV. Cash is unchanged. The operating book still requires independent review and approval before posting.",
    sources: ["Property carrying value comes from the existing synthetic property ledger. Amounts use the engine's integer-cent precision.", "The existing valuation journal preview updates property assets and valuation gain/loss.", "Consolidated NAV uses the existing SPV eliminations and investor allocation engine. This Home preview does not approve or post to a workspace."],
  };
}

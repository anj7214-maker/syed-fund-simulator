export type REEnvironment = "Live Mode" | "Sandbox";
export type RERole = "Analyst" | "SME" | "Controller";
export type REStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Posted" | "Rejected";
export type REKind = "Rent invoice" | "Rent receipt" | "Expense accrual" | "Expense payment" | "Capex" | "Loan drawdown" | "Principal repayment" | "Interest accrual" | "Capital call" | "Contribution" | "Distribution declaration" | "Distribution payment" | "Valuation" | "Management fee" | "Fee payment" | "Intercompany funding" | "Manual journal";
export const kinds: REKind[] = ["Rent invoice", "Rent receipt", "Expense accrual", "Expense payment", "Capex", "Loan drawdown", "Principal repayment", "Interest accrual", "Capital call", "Contribution", "Distribution declaration", "Distribution payment", "Valuation", "Management fee", "Fee payment", "Intercompany funding", "Manual journal"];
export const accounts = {
  Cash: "Asset", Property: "Asset", RentReceivable: "Asset", Investment: "Asset", IntercompanyReceivable: "Asset", Prepayment: "Asset",
  Debt: "Liability", Payable: "Liability", InterestPayable: "Liability", FeePayable: "Liability", DistributionPayable: "Liability", TenantDeposit: "Liability", IntercompanyPayable: "Liability",
  Capital: "Equity", SPVEquity: "Equity", Distributions: "Equity",
  RentalIncome: "Income", ValuationGain: "Income", OperatingExpense: "Expense", InterestExpense: "Expense", ManagementFeeExpense: "Expense",
} as const;
export type Account = keyof typeof accounts;
export interface REEntity { id: string; name: string; currency: string; parent: string | null; ownership: number }
export interface REProperty { id: string; entityId: string; name: string; sector: string; cost: number; valuation: number; valuationDate: string; approved: boolean; capRate: number }
export interface RELease { id: string; propertyId: string; tenant: string; monthlyRent: number; start: string; end: string }
export interface RELoan { id: string; entityId: string; lender: string; principal: number; annualRate: number; days: number; maturity: string; maxLtv: number }
export interface REInvestor { id: string; name: string; commitment: number; openingCapital: number; type: "LP" | "GP" }
export interface RETx { id: string; entityId: string; kind: REKind; amount: number; date: string; reference: string; description: string; investorId?: string; propertyId?: string; loanId?: string; targetEntityId?: string; debit?: Account; credit?: Account; status: REStatus; maker: string; reviewer?: string; approver?: string; reason: string; evidence: string }
export interface RELine { entityId: string; account: Account; amount: number; investorId?: string }
export interface REJournal { id: string; sourceId: string; date: string; lines: RELine[]; rate: number; source?: RETx; reversalOf?: string; reversedBy?: string }
export interface REAudit { id: string; at: string; user: string; action: string; record: string; old: string; value: string; reason: string }
export interface REBook { version: 1; asOf: string; periodStart: string; closed: boolean; published: boolean; entities: REEntity[]; properties: REProperty[]; leases: RELease[]; loans: RELoan[]; investors: REInvestor[]; transactions: RETx[]; journals: REJournal[]; bank: Record<string, number>; fx: Record<string, number>; openingFx: Record<string, number>; managementRate: number; feeDays: number; scenario: string | null; scenarioStarted?: string; finding: string; audit: REAudit[] }
export const actors: Record<RERole, string> = { Analyst: "analyst.demo", SME: "reviewer.demo", Controller: "controller.demo" };
export const cents = (value: number) => { const n = Math.round(value * 100); if (!Number.isSafeInteger(n)) throw new Error("Amount exceeds supported monetary precision."); return n; };
export const money = (value: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format((value === 0 ? 0 : value) / 100);
export const round = (n: number) => { const v = Math.round(n); if (!Number.isSafeInteger(v)) throw new Error("Unsafe financial amount."); return v; };
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const copy = <T,>(v: T): T => structuredClone(v);
export const entityRate = (book: REBook, id: string) => book.fx[book.entities.find(e => e.id === id)?.currency ?? "USD"] ?? 0;
export function linesFor(tx: RETx, book: REBook): RELine[] {
  const line = (account: Account, amount: number): RELine => ({ entityId: tx.entityId, account, amount, investorId: tx.investorId });
  const pair = (debit: Account, credit: Account) => [line(debit, tx.amount), line(credit, -tx.amount)];
  switch (tx.kind) {
    case "Rent invoice": return pair("RentReceivable", "RentalIncome");
    case "Rent receipt": return pair("Cash", "RentReceivable");
    case "Expense accrual": return pair("OperatingExpense", "Payable");
    case "Expense payment": return pair("Payable", "Cash");
    case "Capex": return pair("Property", "Cash");
    case "Loan drawdown": return pair("Cash", "Debt");
    case "Principal repayment": return pair("Debt", "Cash");
    case "Interest accrual": return pair("InterestExpense", "InterestPayable");
    case "Contribution": return pair("Cash", "Capital");
    case "Capital call": return [];
    case "Distribution declaration": return pair("Distributions", "DistributionPayable");
    case "Distribution payment": return pair("DistributionPayable", "Cash");
    case "Valuation": {
      const property = book.properties.find(p => p.id === tx.propertyId);
      const carrying = propertyCarrying(book, property?.id ?? "");
      const movement = tx.amount - carrying;
      return [line("Property", movement), line("ValuationGain", -movement)];
    }
    case "Management fee": return pair("ManagementFeeExpense", "FeePayable");
    case "Fee payment": return pair("FeePayable", "Cash");
    case "Intercompany funding": {
      if (!tx.targetEntityId || tx.targetEntityId === tx.entityId) throw new Error("Select a distinct receiving entity.");
      if (book.entities.find(e => e.id === tx.entityId)?.currency !== book.entities.find(e => e.id === tx.targetEntityId)?.currency) throw new Error("Cross-currency intercompany funding requires a separate FX conversion; unsupported in this release.");
      return [...pair("IntercompanyReceivable", "Cash"), { entityId: tx.targetEntityId, account: "Cash", amount: tx.amount }, { entityId: tx.targetEntityId, account: "IntercompanyPayable", amount: -tx.amount }];
    }
    case "Manual journal": if (!tx.debit || !tx.credit || tx.debit === tx.credit) throw new Error("Choose distinct debit and credit accounts."); return pair(tx.debit, tx.credit);
  }
}
export function postedTransactions(book: REBook) { return book.journals.filter(j => j.source && !j.reversedBy && !j.reversalOf).map(j => j.source!); }
export function balances(book: REBook, entityId?: string) {
  const result = Object.fromEntries(Object.keys(accounts).map(a => [a, 0])) as Record<Account, number>;
  for (const journal of book.journals) for (const line of journal.lines) if (!entityId || line.entityId === entityId) result[line.account] += line.amount;
  return result;
}
export function propertyCarrying(book: REBook, propertyId: string) {
  const p = book.properties.find(p => p.id === propertyId);
  if (!p) return 0;
  return balances(book, p.entityId).Property;
}
export function expectedInterest(book: REBook, loan: RELoan) {
  const periodDays = Math.floor((Date.parse(book.asOf) - Date.parse(book.periodStart)) / 86400000) + 1;
  let weightedPrincipal = loan.principal * periodDays;
  for (const tx of postedTransactions(book).filter(t => t.entityId === loan.entityId && ["Loan drawdown", "Principal repayment"].includes(t.kind))) {
    const days = Math.max(0, Math.min(periodDays, Math.floor((Date.parse(book.asOf) - Date.parse(tx.date)) / 86400000) + 1));
    weightedPrincipal += (tx.kind === "Loan drawdown" ? tx.amount : -tx.amount) * days;
  }
  return round(weightedPrincipal * loan.annualRate / 365);
}
export function expectedFee(book: REBook) { return round(sum(book.investors.map(i => i.commitment)) * book.managementRate * book.feeDays / 365); }
export function audit(book: REBook, user: string, action: string, record: string, old: unknown, value: unknown, reason: string) {
  book.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), user, action, record, old: JSON.stringify(old), value: JSON.stringify(value), reason });
  book.published = false;
}
export function validateTx(book: REBook, tx: RETx): string[] {
  const errors: string[] = [];
  const entity = book.entities.find(e => e.id === tx.entityId);
  if (!entity) errors.push("Unknown entity.");
  if (!Number.isSafeInteger(tx.amount) || tx.amount <= 0) errors.push("Amount must be positive integer minor units.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date) || !Number.isFinite(Date.parse(tx.date))) errors.push("Invalid ISO date.");
  if (tx.date < book.periodStart || tx.date > book.asOf) errors.push("Transaction is outside the open accounting period.");
  if (book.closed) errors.push("Period is closed; Controller must reopen with a reason.");
  if (!entityRate(book, tx.entityId)) errors.push("Missing FX rate.");
  if (!tx.reason.trim() || !tx.evidence.trim()) errors.push("Reason and evidence reference are required.");
  if (["Capital call", "Contribution", "Distribution declaration", "Distribution payment"].includes(tx.kind) && (!book.investors.some(i => i.id === tx.investorId) || tx.entityId !== "FUND")) errors.push("Capital activity requires a valid fund investor.");
  if (["Rent invoice", "Valuation", "Capex"].includes(tx.kind) && !book.properties.some(p => p.id === tx.propertyId && p.entityId === tx.entityId)) errors.push("Property does not belong to this entity.");
  if (tx.kind === "Rent invoice" || tx.kind === "Expense accrual" || tx.kind === "Distribution declaration" || tx.kind === "Management fee") {
    const paid = sum(postedTransactions(book).filter(t => t.reference === tx.id && ["Rent receipt", "Expense payment", "Distribution payment", "Fee payment"].includes(t.kind)).map(t => t.amount));
    if (paid > tx.amount) errors.push("Revised accrual would be less than already allocated payments.");
  }
  if (tx.kind === "Interest accrual" && !book.loans.some(l => l.id === tx.loanId && l.entityId === tx.entityId)) errors.push("Loan does not belong to this entity.");
  if (["Loan drawdown", "Principal repayment"].includes(tx.kind) && !book.loans.some(l => l.id === tx.loanId && l.entityId === tx.entityId)) errors.push("Debt activity requires a matching loan.");
  if (["Rent receipt", "Expense payment", "Distribution payment", "Fee payment"].includes(tx.kind)) {
    const linkedKinds: Partial<Record<REKind, REKind>> = { "Rent receipt": "Rent invoice", "Expense payment": "Expense accrual", "Distribution payment": "Distribution declaration", "Fee payment": "Management fee" };
    const source = postedTransactions(book).find(t => t.id === tx.reference && t.kind === linkedKinds[tx.kind] && t.entityId === tx.entityId);
    if (!source) errors.push("A matching posted source transaction is required.");
    else {
      const already = sum(postedTransactions(book).filter(t => t.reference === source.id && t.kind === tx.kind && t.id !== tx.id).map(t => t.amount));
      if (already + tx.amount > source.amount) errors.push("Payment exceeds the linked outstanding balance.");
      if (tx.investorId !== source.investorId) errors.push("Payment investor must match the declaration.");
    }
  }
  if (tx.kind === "Contribution") {
    const investor = book.investors.find(i => i.id === tx.investorId);
    const paid = sum(postedTransactions(book).filter(t => t.kind === "Contribution" && t.investorId === tx.investorId && t.id !== tx.id).map(t => t.amount));
    if (investor && paid + investor.openingCapital + tx.amount > investor.commitment) errors.push("Contribution exceeds the remaining commitment.");
  }
  if (tx.kind === "Principal repayment" && tx.amount > -balances(book, tx.entityId).Debt) errors.push("Repayment exceeds debt principal.");
  if (tx.kind === "Manual journal" && [tx.debit, tx.credit].some(a => a && ["Debt", "Investment", "Capital", "SPVEquity", "Distributions", "IntercompanyReceivable", "IntercompanyPayable"].includes(a))) errors.push("Use a structured debt, capital or intercompany transaction instead of bypassing its source controls.");
  if (tx.kind === "Manual journal" && [tx.debit, tx.credit].some(a => !a || !Object.hasOwn(accounts, a))) errors.push("Manual journal requires valid chart-of-accounts codes.");
  try { const lines = linesFor(tx, book); if (sum(lines.map(l => l.amount)) !== 0) errors.push("Journal is out of balance."); } catch (e) { errors.push((e as Error).message); }
  return errors;
}
function postInto(book: REBook, tx: RETx) {
  const previous = book.journals.find(j => j.sourceId === tx.id && !j.reversedBy && !j.reversalOf);
  if (previous) {
    const reversalId = crypto.randomUUID();
    previous.reversedBy = reversalId;
    book.journals.push({ id: reversalId, sourceId: tx.id, date: tx.date, rate: previous.rate, reversalOf: previous.id, lines: previous.lines.map(l => ({ ...l, amount: -l.amount })) });
  }
  tx.status = "Posted";
  book.journals.push({ id: crypto.randomUUID(), sourceId: tx.id, date: tx.date, rate: entityRate(book, tx.entityId), source: copy(tx), lines: linesFor(tx, book) });
  if (tx.kind === "Valuation") {
    const property = book.properties.find(p => p.id === tx.propertyId);
    if (property) { property.valuation = tx.amount; property.valuationDate = tx.date; property.approved = true; }
  }
}
export function transition(bookIn: REBook, id: string, next: REStatus, role: RERole): REBook {
  const book = copy(bookIn); const tx = book.transactions.find(t => t.id === id);
  if (!tx) throw new Error("Transaction not found.");
  const user = actors[role]; const current = tx.status;
  const permitted: Partial<Record<REStatus, REStatus>> = { Submitted: "Draft", Reviewed: "Submitted", Approved: "Reviewed", Posted: "Approved" };
  if (next === "Rejected") { if (role === "Analyst" || user === tx.maker || !["Submitted", "Reviewed"].includes(current)) throw new Error("Only a different reviewer may reject a pending proposal."); }
  else if (permitted[next] !== current) throw new Error(`Cannot move ${current} to ${next}.`);
  if (["Reviewed", "Approved", "Posted"].includes(next) && user === tx.maker) throw new Error("Four-eyes control: maker cannot review, approve or post their own proposal.");
  if (next === "Reviewed" && role === "Analyst") throw new Error("Reviewer authority required.");
  if (["Approved", "Posted"].includes(next) && role !== "Controller") throw new Error("Controller authority required.");
  if (next !== "Rejected") { const issues = validateTx(book, tx); if (issues.length) throw new Error(issues.join(" ")); }
  if (next === "Reviewed") tx.reviewer = user;
  if (next === "Approved") tx.approver = user;
  if (next === "Posted") postInto(book, tx); else tx.status = next;
  audit(book, user, next, id, current, next, tx.reason);
  return book;
}
export function amend(bookIn: REBook, id: string, changes: Partial<RETx>, role: RERole): REBook {
  const book = copy(bookIn); const tx = book.transactions.find(t => t.id === id); if (!tx) throw new Error("Missing source record.");
  if (book.closed) throw new Error("Reopen the period before preparing a correction.");
  if (!["Posted", "Draft", "Rejected"].includes(tx.status)) throw new Error("Pending approvals are locked. Reject before amendment.");
  const old = copy(tx);
  Object.assign(tx, changes, { id: tx.id, status: "Draft", maker: actors[role], reviewer: undefined, approver: undefined });
  audit(book, actors[role], "Prepare amendment", id, old, tx, tx.reason);
  return book;
}
export function projection(bookIn: REBook) {
  const book = copy(bookIn); const errors: string[] = [];
  for (const tx of book.transactions.filter(t => !["Posted", "Rejected"].includes(t.status))) {
    const issues = validateTx(book, tx);
    if (issues.length) errors.push(`${tx.id}: ${issues.join(" ")}`); else postInto(book, tx);
  }
  return { book, errors };
}
export function calculate(book: REBook) {
  const posted = postedTransactions(book);
  const entityRows = book.entities.map(e => {
    const local = balances(book, e.id); const rate = entityRate(book, e.id);
    const assets = sum((Object.keys(accounts) as Account[]).filter(a => accounts[a] === "Asset").map(a => round(local[a] * rate)));
    const liabilities = -sum((Object.keys(accounts) as Account[]).filter(a => accounts[a] === "Liability").map(a => round(local[a] * rate)));
    const pnl = -sum(book.journals.flatMap(j => j.lines.filter(l => l.entityId === e.id && ["Income", "Expense"].includes(accounts[l.account])).map(l => round(l.amount * j.rate))));
    const capital = -sum(book.journals.flatMap(j => j.lines.filter(l => l.entityId === e.id && accounts[l.account] === "Equity").map(l => round(l.amount * j.rate))));
    return { entity: e, local, rate, assets, liabilities, netAssets: assets - liabilities, pnl, capital, translation: assets - liabilities - pnl - capital };
  });
  const fund = entityRows.find(e => e.entity.id === "FUND")!;
  const investmentElimination = fund.local.Investment;
  const intercompanyAsset = sum(entityRows.map(e => round(e.local.IntercompanyReceivable * e.rate)));
  const intercompanyLiability = -sum(entityRows.map(e => round(e.local.IntercompanyPayable * e.rate)));
  const assets = sum(entityRows.map(e => e.assets)) - investmentElimination - intercompanyAsset;
  const liabilities = sum(entityRows.map(e => e.liabilities)) - intercompanyLiability;
  const nav = assets - liabilities; const pnl = sum(entityRows.map(e => e.pnl)); const translation = sum(entityRows.map(e => e.translation));
  const capital = fund.capital; const contribution = sum(posted.filter(t => t.kind === "Contribution").map(t => t.amount));
  const distributions = sum(posted.filter(t => t.kind === "Distribution declaration").map(t => t.amount));
  const openingNav = sum(book.investors.map(i => i.openingCapital));
  const weightTotal = sum(book.investors.map(i => i.openingCapital));
  const investors = book.investors.map((i, idx) => {
    const flow = sum(posted.filter(t => t.investorId === i.id && t.kind === "Contribution").map(t => t.amount));
    const paid = sum(posted.filter(t => t.investorId === i.id && t.kind === "Distribution declaration").map(t => t.amount));
    const weight = weightTotal ? i.openingCapital / weightTotal : 0;
    const previous = book.investors.slice(0, idx);
    const allocatedPnl = idx === book.investors.length - 1 ? pnl - sum(previous.map(x => round(pnl * x.openingCapital / weightTotal))) : round(pnl * weight);
    const allocatedFx = idx === book.investors.length - 1 ? translation - sum(previous.map(x => round(translation * x.openingCapital / weightTotal))) : round(translation * weight);
    const managementFee = idx === book.investors.length - 1 ? fund.local.ManagementFeeExpense - sum(previous.map(x => round(fund.local.ManagementFeeExpense * x.openingCapital / weightTotal))) : round(fund.local.ManagementFeeExpense * weight);
    return { ...i, weight, contribution: flow, distribution: paid, pnl: allocatedPnl, fx: allocatedFx, managementFee, closing: i.openingCapital + flow - paid + allocatedPnl + allocatedFx, undrawn: i.commitment - i.openingCapital - flow };
  });
  const cash = sum(entityRows.map(e => round(e.local.Cash * e.rate)));
  const tb = entityRows.flatMap(e => (Object.keys(accounts) as Account[]).filter(a => e.local[a] !== 0).map(a => ({ entityId: e.entity.id, account: a, category: accounts[a], currency: e.entity.currency, debit: Math.max(e.local[a], 0), credit: Math.max(-e.local[a], 0), base: round(e.local[a] * e.rate) })));
  const bankRows = entityRows.map(e => ({ entityId: e.entity.id, currency: e.entity.currency, ledger: e.local.Cash, external: book.bank[e.entity.id] ?? 0, difference: e.local.Cash - (book.bank[e.entity.id] ?? 0) }));
  const controls: { name: string; residual: number; severity: "Low" | "Medium" | "High" | "Critical"; owner: string; source: string }[] = [];
  const add = (name: string, residual: number, severity: "Low" | "Medium" | "High" | "Critical", source: string, owner = "Fund Controller") => { if (residual !== 0) controls.push({ name, residual, severity, owner, source }); };
  for (const e of entityRows) add("Local trial balance imbalance", sum(Object.values(e.local)), "Critical", e.entity.id);
  for (const j of book.journals) add("Journal imbalance", sum(j.lines.map(l => l.amount)), "Critical", j.id);
  add("Investor capital to NAV", nav - sum(investors.map(i => i.closing)), "Critical", "Investor Accounting");
  add("NAV movement bridge", nav - openingNav - contribution + distributions - pnl - translation, "Critical", "NAV Bridge");
  add("Intercompany mismatch", intercompanyAsset - intercompanyLiability, "High", "Intercompany");
  for (const row of bankRows) add("Bank difference (local minor units)", row.difference, Math.abs(row.difference * entityRate(book, row.entityId)) >= Math.abs(nav) * .005 ? "Critical" : "Medium", row.entityId, "Cash Operations");
  for (const p of book.properties) {
    const days = (Date.parse(book.asOf) - Date.parse(p.valuationDate)) / 86400000;
    add("Valuation evidence missing / stale", !p.approved || days > 100 || days < 0 ? 1 : 0, "High", p.id, "Valuation Reviewer");
    add("Property valuation to carrying amount", propertyCarrying(book, p.id) - p.valuation, "High", p.id, "Valuation Reviewer");
  }
  for (const loan of book.loans) {
    const e = entityRows.find(e => e.entity.id === loan.entityId)!;
    const ltv = e.local.Property > 0 ? -e.local.Debt / e.local.Property : Infinity;
    add("Loan LTV covenant breached", ltv > loan.maxLtv ? round(-e.local.Debt - e.local.Property * loan.maxLtv) : 0, "High", loan.id, "Debt Operations");
    add("Interest accrual validation", e.local.InterestExpense - expectedInterest(book, loan), "High", loan.id, "Accounting Reviewer");
  }
  add("Management fee validation", fund.local.ManagementFeeExpense - expectedFee(book), "High", "Fee schedule", "Fee Reviewer");
  for (const entity of book.entities) { add("Missing FX", entityRate(book, entity.id) <= 0 ? 1 : 0, "Critical", entity.currency); }
  for (const e of entityRows) add("Negative cash balance", e.local.Cash < 0 ? round(e.local.Cash * e.rate) : 0, "High", e.entity.id, "Cash Operations");
  const pending = book.transactions.filter(t => !["Posted", "Rejected"].includes(t.status));
  add("Pending accounting proposals", pending.length, "High", "Approval Queue");
  const earnings = tb.filter(t => t.category === "Income" || t.category === "Expense");
  return { entityRows, tb, bankRows, assets, liabilities, nav, cash, pnl, translation, capital, investors, openingNav, contribution, distributions, controls, pending, posted, investmentElimination, intercompanyAsset, intercompanyLiability, earnings, ready: controls.length === 0 };
}
export interface WaterfallInput { proceeds: number; lpCapital: number; gpCapital: number; prefRate: number; years: number; carry: number; catchupRate: number }
export function waterfall(input: WaterfallInput) {
  const { proceeds, lpCapital, gpCapital, prefRate, years, carry, catchupRate } = input;
  if ([proceeds, lpCapital, gpCapital].some(n => !Number.isSafeInteger(n) || n < 0) || prefRate < 0 || years < 0 || carry < 0 || carry >= 1 || catchupRate < 0 || catchupRate > 1) throw new Error("Invalid waterfall assumptions.");
  let remaining = proceeds;
  const total = lpCapital + gpCapital; const roc = Math.min(remaining, total);
  const lpRoc = total ? round(roc * lpCapital / total) : 0; const gpRoc = roc - lpRoc; remaining -= roc;
  const prefDue = round(lpCapital * prefRate * years); const pref = Math.min(remaining, prefDue); remaining -= pref;
  // Catch-up allocation rate and target carry share are separate contractual inputs.
  const catchupPool = catchupRate > carry ? Math.min(remaining, round(carry * pref / (catchupRate - carry))) : 0;
  const gpCatchup = round(catchupPool * catchupRate); const lpCatchup = catchupPool - gpCatchup; remaining -= catchupPool;
  const gpResidual = round(remaining * carry); const lpResidual = remaining - gpResidual;
  return { lpRoc, gpRoc, prefDue, pref, lpCatchup, gpCatchup, lpResidual, gpResidual, lpTotal: lpRoc + pref + lpCatchup + lpResidual, gpTotal: gpRoc + gpCatchup + gpResidual, undistributed: proceeds - roc - pref - catchupPool - remaining, lpUnreturned: lpCapital - lpRoc, gpUnreturned: gpCapital - gpRoc };
}
export function createBook(): REBook {
  const book: REBook = { version: 1, asOf: "2026-09-30", periodStart: "2026-09-01", closed: false, published: false, entities: [{ id: "FUND", name: "Meridian Real Estate Fund", currency: "USD", parent: null, ownership: 1 }], properties: [], leases: [], loans: [], investors: [], transactions: [], journals: [], bank: {}, fx: { USD: 1, EUR: 1.1 }, openingFx: { USD: 1, EUR: 1.1 }, managementRate: .015, feeDays: 30, scenario: null, finding: "", audit: [] };
  const sectors = ["Office", "Logistics", "Residential", "Retail"];
  for (let p = 0; p < 4; p++) {
    const entityId = `SPV-${p + 1}`; const propertyId = `PROP-${p + 1}`;
    book.entities.push({ id: entityId, name: `Meridian ${sectors[p]} SPV`, currency: p === 3 ? "EUR" : "USD", parent: "FUND", ownership: 1 });
    book.properties.push({ id: propertyId, entityId, name: `${["Harbor", "Gateway", "Parkside", "Riverside"][p]} ${sectors[p]}`, sector: sectors[p], cost: cents(10000000), valuation: cents(10000000), valuationDate: "2026-09-30", approved: true, capRate: .055 + p * .005 });
    book.loans.push({ id: `LOAN-${p + 1}`, entityId, lender: p % 2 ? "HSBC (illustrative)" : "JPMorgan Chase (illustrative)", principal: cents(3000000), annualRate: .05 + p * .005, days: 30, maturity: "2029-09-30", maxLtv: .65 });
    const lines: RELine[] = [{ entityId, account: "Property", amount: cents(10000000) }, { entityId, account: "Cash", amount: cents(1000000) }, { entityId, account: "Debt", amount: -cents(3000000) }, { entityId, account: "SPVEquity", amount: -cents(8000000) }];
    book.journals.push({ id: `OPEN-${entityId}`, sourceId: `Opening ${entityId}`, date: "2026-08-31", rate: entityRate(book, entityId), lines });
    for (let n = 0; n < 6; n++) book.leases.push({ id: `LEASE-${p * 6 + n + 1}`, propertyId, tenant: `Tenant ${p * 6 + n + 1} Ltd (fictional)`, monthlyRent: cents(12000 + p * 1500 + n * 1000), start: "2025-01-01", end: "2029-12-31" });
  }
  const investments = sum(book.properties.map(p => round(cents(8000000) * entityRate(book, p.entityId))));
  const opening = cents(2000000) + investments;
  const fractions = [.3, .25, .2, .15, .1]; let assigned = 0;
  book.investors = fractions.map((w, i) => { const capital = i === 4 ? opening - assigned : round(opening * w); assigned += capital; return { id: `INV-${i + 1}`, name: ["Harbor Pension", "Oak Endowment", "Maple Family Office", "Summit Foundation", "Meridian GP"][i] + " (fictional)", commitment: capital * 2, openingCapital: capital, type: i === 4 ? "GP" : "LP" }; });
  book.journals.push({ id: "OPEN-FUND", sourceId: "Opening FUND", date: "2026-08-31", rate: 1, lines: [{ entityId: "FUND", account: "Cash", amount: cents(2000000) }, ...book.properties.map(p => ({ entityId: "FUND", account: "Investment" as Account, amount: round(cents(8000000) * entityRate(book, p.entityId)) })), ...book.investors.map(i => ({ entityId: "FUND", account: "Capital" as Account, amount: -i.openingCapital, investorId: i.id }))] });
  const seed = (tx: Omit<RETx, "status" | "maker" | "reason" | "evidence">) => {
    const full: RETx = { ...tx, status: "Posted", maker: actors.Analyst, reviewer: actors.SME, approver: actors.Controller, reason: "Validated synthetic baseline", evidence: `SAMPLE/${tx.id}` };
    book.transactions.push(full); postInto(book, full);
  };
  for (const [n, lease] of book.leases.entries()) {
    const p = book.properties.find(p => p.id === lease.propertyId)!;
    seed({ id: `RENT-${n + 1}`, kind: "Rent invoice", entityId: p.entityId, propertyId: p.id, amount: lease.monthlyRent, date: "2026-09-01", reference: lease.id, description: "September contractual rent" });
    seed({ id: `RCPT-${n + 1}`, kind: "Rent receipt", entityId: p.entityId, propertyId: p.id, amount: lease.monthlyRent, date: "2026-09-10", reference: `RENT-${n + 1}`, description: "Allocated tenant receipt" });
    seed({ id: `EXP-${n + 1}`, kind: "Expense accrual", entityId: p.entityId, propertyId: p.id, amount: cents(1500 + n * 75), date: "2026-09-15", reference: `BILL-${n + 1}`, description: ["Insurance", "Utilities", "Repairs", "Property management"][n % 4] });
    seed({ id: `PAY-${n + 1}`, kind: "Expense payment", entityId: p.entityId, amount: cents(1500 + n * 75), date: "2026-09-20", reference: `EXP-${n + 1}`, description: "Supplier payment" });
  }
  for (const loan of book.loans) seed({ id: `INT-${loan.id}`, kind: "Interest accrual", entityId: loan.entityId, loanId: loan.id, amount: expectedInterest(book, loan), date: book.asOf, reference: loan.id, description: "Actual/365 monthly interest" });
  seed({ id: "FEE-SEP", kind: "Management fee", entityId: "FUND", amount: expectedFee(book), date: book.asOf, reference: "Committed capital / Actual365", description: "September management fee" });
  for (const e of book.entities) book.bank[e.id] = balances(book, e.id).Cash;
  return book;
}
export const scenarios = [
  { id: "rent", name: "Unallocated rent receipt", area: "Cash & Bank Reconciliation", objective: "Record the receipt against the correct invoice; do not recognize rental income twice.", hint: "Compare the bank delta with the tenant invoice. Receipt debits cash and credits receivables." },
  { id: "valuation", name: "Property valuation decline", area: "Valuation & Performance", objective: "Review valuation evidence and post a fair-value loss under the stated policy.", hint: "Compare the proposed valuation with the carrying amount, not the original acquisition cost." },
  { id: "interest", name: "Missing loan interest", area: "Debt & Interest", objective: "Restore Actual/365 interest and obtain a different reviewer's signoff.", hint: "Use principal, annual rate and accrual days. Principal itself is not an expense." },
  { id: "fee", name: "Incorrect management fee", area: "Fees & Waterfall", objective: "Reconcile the posted expense to committed capital, rate and accrual days.", hint: "Fee payment clears a payable; it does not create a second fee expense." },
  { id: "stale", name: "Stale appraisal blocks release", area: "Valuation & Performance", objective: "Restore supported valuation evidence through controlled approval.", hint: "A valuation-date edit alone needs independent review before release." },
  { id: "duplicate", name: "Duplicate source file", area: "File Uploads & Exports", objective: "Attempt re-import of the supplied baseline; verify duplicate rejection.", hint: "Transaction IDs are idempotency keys. No duplicate journals should be created." },
] as const;
export function injectScenario(id: string): REBook {
  const book = createBook(); book.scenario = id; book.scenarioStarted = new Date().toISOString();
  if (id === "rent") {
    const receipt = book.journals.find(j => j.sourceId === "RCPT-1")!;
    book.journals = book.journals.filter(j => j.id !== receipt.id);
    book.transactions = book.transactions.filter(t => t.id !== "RCPT-1");
  }
  if (id === "valuation") { const p = book.properties[0]; book.properties[0] = { ...p, valuation: round(p.valuation * .88), approved: false }; }
  if (id === "interest" || id === "fee") {
    const sourceId = id === "interest" ? "INT-LOAN-1" : "FEE-SEP";
    book.transactions = book.transactions.filter(t => t.id !== sourceId); book.journals = book.journals.filter(j => j.sourceId !== sourceId);
  }
  if (id === "stale") book.properties[0].valuationDate = "2026-01-01";
  audit(book, "scenario.system", "Inject synthetic incident", id, "Clean baseline", id, "Sandbox only");
  return book;
}

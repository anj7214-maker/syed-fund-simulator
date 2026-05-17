import { recalculate } from "./recalc";
import { BreakItem, CapitalActivity, Derivative, FxRate, Holding, ImpactSnapshot, Investor, ModuleId, ScenarioDefinition, ScenarioDifficulty, ScenarioFundType, Trade } from "../types";

type ScenarioSeed = {
  name: string;
  difficulty: ScenarioDifficulty;
  objective: string;
  context: string;
  changes: string[];
  nav: string;
  pnl: string;
  gl: string;
  cash: string;
  investor: string;
  recon: string;
  controls: string[];
  task: string;
  resolution: string;
};

const moduleFundType: Partial<Record<ModuleId, ScenarioFundType>> = {
  holdings: "Multi-Strategy Fund",
  trades: "Hedge Fund",
  cashRecon: "Hedge Fund",
  positionRecon: "Hedge Fund",
  pricing: "Multi-Strategy Fund",
  corporateActions: "Long Only Fund",
  gl: "Hedge Fund",
  nav: "Multi-Strategy Fund",
  capital: "Hedge Fund",
  subsReds: "Hedge Fund",
  risk: "Multi-Strategy Fund",
  stress: "Multi-Strategy Fund",
  scenario: "Multi-Strategy Fund",
};

const tableMap: Partial<Record<ModuleId, string[]>> = {
  holdings: ["Portfolio Holdings", "Pricing Engine", "P&L", "NAV Package", "Risk Exposure"],
  trades: ["Trade Blotter", "General Ledger", "Cash Recon", "Position Recon", "Audit Trail"],
  cashRecon: ["Cash Reconciliation", "Break Management", "General Ledger", "NAV Package"],
  positionRecon: ["Position Reconciliation", "Break Management", "Holdings", "NAV Package"],
  pricing: ["Pricing Engine", "Holdings", "P&L", "General Ledger", "NAV Package"],
  corporateActions: ["Corporate Actions", "Dividend Accruals", "Coupon Accruals", "General Ledger", "Cash Recon"],
  gl: ["General Ledger", "Trial Balance", "P&L", "Balance Sheet", "NAV Package"],
  nav: ["NAV Package", "Investor Allocation", "Fees", "Workflow Approval Queue"],
  capital: ["Investor Capital Activity", "Subscriptions & Redemptions", "Equalization", "NAV Package"],
  subsReds: ["Subscriptions & Redemptions", "Investor Capital Activity", "NAV Package"],
  risk: ["Risk & Exposure", "Stress Testing", "Portfolio Holdings", "NAV Package"],
  stress: ["Stress Testing", "Scenario Simulation", "Risk & Exposure", "NAV Package"],
  scenario: ["Scenario Simulation", "Risk & Exposure", "NAV Package", "AI Copilot"],
};

const seeds: Record<string, ScenarioSeed[]> = {
  holdings: [
    s("Equity price drops 12%", "Beginner", "Trace a price shock through holdings, unrealized P&L and NAV.", "A liquid equity mark comes in below prior close after valuation cut.", ["Reduce MSFT market price by 12%", "Flag pricing tolerance breach"], "NAV falls through lower fair value.", "Unrealized P&L decreases.", "Fair value journal updates investments and unrealized gain/loss.", "No direct cash movement.", "Investor allocation percentages move with NAV/share.", "Pricing break generated for tolerance review.", ["Price tolerance breach", "NAV movement threshold"], "Identify the position, quantify NAV impact, and decide if valuation review is required.", "Obtain vendor support, document price source, approve or challenge mark."),
    s("FX moves against base currency", "Intermediate", "Explain local versus base-currency valuation impact.", "EUR, GBP and JPY exposures revalue after WM/Reuters rates move.", ["Shock non-USD FX rates", "Update FX gain/loss"], "NAV changes through translated market value.", "FX P&L moves separately from price P&L.", "FX remeasurement posting updates income.", "No custody cash movement unless FX settlement exists.", "Non-USD investors see allocation movement.", "FX break can appear if source differs.", ["FX variance check", "Currency concentration breach"], "Separate price P&L from FX P&L and identify affected currencies.", "Validate FX source, rerun valuation, and evidence material rate movements."),
    s("Bond dirty price changes", "Advanced", "Practice clean/dirty price and accrued-interest review.", "A credit instrument receives an evaluated dirty price update.", ["Increase DBR market price", "Create accrual review flag"], "NAV increases from bond valuation and interest accrual.", "Unrealized P&L and interest income change.", "Investment and interest receivable postings update.", "No cash until coupon pay date.", "Investor NAV/share increases.", "Pricing/accrual break generated.", ["Dirty vs clean price issue", "Accrued interest mismatch"], "Explain whether the movement is price, accrual or FX driven.", "Confirm clean price, accrued interest, and vendor methodology."),
    s("Stale price loaded", "Real World Ops", "Detect stale pricing before NAV publication.", "A vendor file repeats prior-day price for a volatile option.", ["Set SPX option last update old", "Generate stale price exception"], "NAV may be misstated if stale mark is accepted.", "Unrealized P&L may be understated.", "No posting until price approved.", "No direct cash impact.", "Investor NAV/share cannot be finalized cleanly.", "Pricing exception blocks NAV release.", ["Stale price validation", "Missing vendor price"], "Find the stale instrument and decide whether NAV publish is blocked.", "Request independent mark or valuation committee approval."),
    s("Short position MTM loss", "NAV Oversight", "Understand short exposure when price rises.", "A short equity rises sharply before close.", ["Increase AAPL market price", "Create short MTM loss"], "NAV decreases because the short liability grows.", "Unrealized loss increases.", "Fair value posting records loss.", "No cash until cover or margin call.", "Investors absorb loss through NAV/share.", "Position risk exception generated.", ["Concentration breach", "Liquidity threshold alert"], "Explain why a price increase can reduce NAV.", "Review borrow, margin and risk limits."),
  ],
  trades: [
    s("Duplicate trade booking", "Beginner", "Identify duplicate trade and GL overstatement.", "Broker confirm was uploaded twice from OMS.", ["Duplicate MSFT trade", "Increase broker fees"], "NAV is understated by duplicated fees and position movement.", "Broker fee expense duplicates.", "Trade GL posts twice.", "Cash recon shows duplicate settlement.", "Investor NAV/share understated.", "Trade and cash breaks generated.", ["Duplicate trade", "Trade lifecycle mismatch"], "Locate duplicate trade and propose correction.", "Cancel duplicate, reverse GL, document broker evidence."),
    s("Wrong buy/sell flag", "Intermediate", "Practice economic direction validation.", "A sell confirm is booked as buy.", ["Flip AAPL trade direction", "Generate position break"], "NAV and exposure direction are wrong.", "Realized/unrealized classification can be wrong.", "Cash/investment legs reverse incorrectly.", "Cash side mismatches broker.", "Investor allocation affected by incorrect NAV.", "Position and cash breaks generated.", ["Trade lifecycle mismatch", "Position break tolerance"], "Determine which side is incorrect and how to amend.", "Amend trade direction, regenerate GL, rematch custody."),
    s("Failed settlement", "Real World Ops", "Simulate settlement fail handling.", "Custodian does not receive shares by settlement date.", ["Mark trade failed", "Generate high position break"], "NAV may include receivable/payable pending settlement.", "No direct P&L if valuation is correct.", "Failed trade receivable/payable remains.", "Cash movement may not match ledger.", "Investor NAV can publish only with documented fail.", "Position break remains open.", ["Failed trade", "Cutoff breach"], "Classify timing versus economic break.", "Obtain broker fail notice and set expected settlement date."),
    s("Wrong broker commission", "Advanced", "Review fee treatment and NAV impact.", "Broker commission is booked 10x expected amount.", ["Increase broker fee", "Create expense exception"], "NAV decreases through broker expense.", "Expense line is overstated.", "Broker fee journal is overstated.", "Cash recon breaks on settlement.", "All investors absorb fee misstatement.", "Cash and GL exception generated.", ["Broker fee validation", "NAV movement threshold"], "Quantify the fee error and propose adjustment.", "Correct trade fee and reverse excess expense."),
    s("Trade amendment after cutoff", "NAV Oversight", "Apply cutoff controls to trade amendments.", "Front office amends trade after valuation cutoff.", ["Create pending amendment", "Generate approval requirement"], "NAV may need estimate or restatement decision.", "P&L depends on amendment economics.", "Manual approval required before posting.", "Settlement may differ from ledger.", "Investor statement may require disclosure.", "Cutoff break generated.", ["Cutoff breach", "Missing approval"], "Decide whether amendment belongs in current NAV.", "Escalate to NAV oversight and document cutoff decision."),
  ],
  cashRecon: [
    s("Dividend missing from ledger", "Beginner", "Find a missing income cash receipt.", "Custodian receives dividend but internal ledger has not posted cash.", ["Create cash recon difference", "Flag dividend receipt"], "NAV may be understated if receivable/cash missing.", "Dividend income may be incomplete.", "Cash and income receivable postings need review.", "Custodian cash exceeds ledger.", "Investor NAV/share affected by income.", "Cash break generated.", ["Cash tolerance break", "Missing accrual"], "Identify missing dividend and required journal.", "Post dividend receivable/cash entry and clear break."),
    s("Prime broker financing charge missing", "Intermediate", "Review financing cost break.", "Prime broker deducts financing charge not booked internally.", ["Reduce PB cash", "Add financing cost break"], "NAV overstated until financing cost booked.", "Expense missing from P&L.", "Financing expense/payable journal required.", "PB cash lower than ledger.", "Investors overstated before correction.", "Cash break generated.", ["Cash tolerance break", "Missing approval"], "Determine if break is valid charge or timing.", "Book financing expense after PB evidence."),
    s("Subscription cash not allocated", "Advanced", "Trace investor cash to capital activity.", "Cash arrived before investor allocation was approved.", ["Add unallocated cash break", "Pending capital activity"], "NAV cash exists but investor capital not allocated.", "No P&L impact.", "Cash asset exists with subscription payable/capital pending.", "Bank cash exceeds internal allocated capital.", "Investor shares not issued yet.", "Investor allocation break generated.", ["Investor allocation mismatch", "Missing approval"], "Explain how cleared funds flow into shares.", "Approve subscription, issue shares, update capital register."),
    s("FX cash in wrong currency", "Real World Ops", "Investigate currency mapping error.", "EUR cash is loaded as USD in internal ledger.", ["Create FX cash mismatch", "Trigger currency validation"], "NAV translation misstated.", "FX gain/loss may be wrong.", "Cash currency account requires reclass.", "Currency-specific cash breaks.", "Investors receive wrong base NAV.", "FX and cash breaks generated.", ["Invalid currency", "FX variance check"], "Find wrong currency side and correction.", "Reclass cash to correct currency and rerun FX translation."),
    s("Wire transfer timing issue", "Beginner", "Classify timing versus real break.", "Outgoing redemption wire leaves bank after ledger cutoff.", ["Create timing cash break"], "NAV may be unaffected if payable is valid.", "No P&L impact.", "Cash/payable timing entry reviewed.", "Bank and ledger differ until next file.", "Redeeming investor statement needs status note.", "Timing break generated.", ["Cash tolerance break", "Cutoff breach"], "Decide whether break is timing or economic.", "Document expected bank clearance and approve if immaterial."),
  ],
  positionRecon: [
    s("Custodian quantity mismatch", "Beginner", "Resolve internal versus custodian position break.", "Custodian quantity differs from internal for AAPL.", ["Generate AAPL position break"], "NAV may be wrong if internal quantity is wrong.", "Unrealized P&L depends on correct quantity.", "Investment balance may require adjustment.", "No direct cash impact.", "Investor NAV/share may be misstated.", "Position break generated.", ["Position break tolerance"], "Identify correct book of record and evidence.", "Match broker/custody records and adjust internal position if needed."),
    s("Pending settlement timing difference", "Intermediate", "Classify pending settlement break.", "Asia market trade is pending at custodian but internal is booked.", ["Mark MUFG pending settlement"], "NAV can include trade if accounting policy permits.", "P&L includes trade economics.", "Trade date accounting entries remain.", "Cash settlement pending.", "Investor NAV includes pending trade.", "Timing break generated.", ["Trade lifecycle mismatch"], "Explain why internal and custodian differ.", "Document settlement cycle and monitor clearance."),
    s("Stock split not processed", "Advanced", "Connect corporate action to position recon.", "Custodian applied split but internal position did not.", ["Create split quantity mismatch"], "NAV may be wrong if price/quantity not adjusted.", "P&L distorted by wrong quantity.", "No economic GL if split handled correctly.", "No direct cash impact.", "Investor NAV/share may be misstated.", "Corporate action and position breaks generated.", ["Corporate action exception"], "Identify split ratio and required adjustment.", "Process split, update security master, rerun recon."),
    s("Short shown as long", "Real World Ops", "Detect sign convention error.", "Prime broker file loads short quantity as positive.", ["Create sign mismatch"], "Exposure and NAV validation may fail.", "P&L direction may be wrong.", "Investment liability classification affected.", "No direct cash impact.", "Investor risk reporting wrong.", "Position break generated.", ["Position break tolerance", "Concentration breach"], "Explain sign convention and correction.", "Normalize PB file sign and rerun matching."),
    s("ADR ratio mismatch", "NAV Oversight", "Resolve reference data driven recon break.", "ADR conversion ratio differs between security master and custodian.", ["Generate ADR ratio break"], "NAV market value can be misstated.", "P&L can be distorted by wrong units.", "Investment balance may need correction.", "No direct cash impact.", "Investor NAV/share potentially misstated.", "Security master and position break generated.", ["Missing identifier", "Security mapping"], "Find whether quantity or multiplier is wrong.", "Update reference data and rerun position recon."),
  ],
  pricing: [
    s("Missing vendor price", "Beginner", "Route missing price to valuation workflow.", "Vendor file omits one listed instrument.", ["Mark price missing", "Generate pricing break"], "NAV cannot be finalized without approved price.", "P&L incomplete.", "No fair value posting for missing mark.", "No cash impact.", "Investor NAV/share blocked.", "Pricing break generated.", ["Missing vendor price"], "Find missing security and decide valuation source.", "Obtain alternate source or approve manual price."),
    s("Price override", "Intermediate", "Practice manual valuation approval.", "Valuation team overrides vendor price after challenge.", ["Apply manual price override"], "NAV updates from approved override.", "Unrealized P&L changes.", "Fair value journal updates.", "No cash impact.", "Investor NAV/share changes.", "Price challenge audit generated.", ["Missing approval", "Price tolerance breach"], "Explain why override requires approval.", "Document source, committee approval and evidence."),
    s("Price variance breach", "Advanced", "Investigate abnormal daily price movement.", "Prior-day comparison exceeds tolerance.", ["Shock option price", "Create tolerance breach"], "NAV moves materially.", "Unrealized P&L changes materially.", "Fair value posting updates.", "No cash impact.", "Investor NAV/share changes.", "Pricing exception generated.", ["Price tolerance breach", "NAV movement threshold"], "Determine whether movement is market or error.", "Validate with independent source and approve challenge."),
    s("Dirty vs clean price issue", "Real World Ops", "Separate bond price from accrued interest.", "Bond price file loads dirty price into clean field.", ["Increase bond price", "Accrual mismatch"], "NAV double-counts accrued interest.", "P&L and income split incorrect.", "Investment and receivable postings distorted.", "No cash until coupon.", "Investor NAV overstated.", "Pricing and accrual break generated.", ["Dirty vs clean price issue"], "Identify double-counted accrual.", "Correct clean price and accrued interest mapping."),
    s("Illiquid pricing challenge", "NAV Oversight", "Run Level 3 valuation controls.", "Level 3 asset requires valuation committee signoff.", ["Flag Level 3 valuation review"], "NAV may be held pending approval.", "P&L depends on committee mark.", "Manual valuation journal requires approval.", "No cash impact.", "Investor reporting may need disclosure.", "Valuation control break generated.", ["Missing approval", "Valuation hierarchy"], "Explain controls for illiquid asset pricing.", "Route to valuation committee and attach evidence."),
  ],
  corporateActions: [
    s("Dividend accrual missing", "Beginner", "Post missing dividend accrual.", "Ex-date passed but income accrual was not booked.", ["Generate dividend accrual break"], "NAV understated by missing income.", "Dividend income understated.", "Dividend receivable/income entry required.", "Cash arrives later on pay date.", "Investors understated until accrual posted.", "Corporate action break generated.", ["Missing accrual"], "Calculate eligible shares and net dividend.", "Post accrual and validate withholding tax."),
    s("WHT treaty applied incorrectly", "Intermediate", "Review withholding tax treatment.", "Tax treaty rate was applied to wrong investor/fund profile.", ["Increase withholding tax", "Create tax exception"], "NAV may be understated or overstated.", "Dividend income net amount wrong.", "Tax receivable/payable may be wrong.", "Cash settlement differs from accrual.", "Investor allocation affected.", "Corporate action break generated.", ["Corporate action exception"], "Compare gross, WHT and net receivable.", "Correct treaty rate and book tax adjustment."),
    s("Stock split failure", "Advanced", "Process mandatory event through holdings and recon.", "Stock split is announced but internal position unchanged.", ["Create stock split position mismatch"], "NAV should remain economically neutral if processed correctly.", "P&L should not move from split alone.", "No gain/loss journal expected.", "No cash impact.", "Investor NAV should remain neutral.", "Position break generated.", ["Corporate action exception"], "Explain why split changes quantity and price, not value.", "Apply split factor and update security master."),
    s("Merger consideration pending", "Real World Ops", "Track receivable for pending merger proceeds.", "Security ceased trading but consideration not received.", ["Generate merger receivable break"], "NAV includes receivable until cash settles.", "Realized gain/loss may crystallize.", "Receivable and realized P&L entries required.", "Cash pending settlement.", "Investor NAV includes receivable.", "Corporate action/cash break generated.", ["Missing approval", "Cash tolerance break"], "Classify receivable versus cash break.", "Book receivable and monitor cash settlement."),
    s("Spin-off allocation issue", "NAV Oversight", "Allocate cost basis between parent and spin-off.", "Spin-off shares are received without cost allocation.", ["Generate spin-off allocation break"], "NAV may be correct but P&L/cost basis wrong.", "Unrealized P&L allocation distorted.", "Cost basis reclassification required.", "No cash impact.", "Investor tax/performance reporting affected.", "Security master and position break generated.", ["Corporate action exception", "Security mapping"], "Explain cost basis allocation controls.", "Apply allocation methodology and approve evidence."),
  ],
  gl: [
    s("Journal out of balance", "Beginner", "Identify debit/credit imbalance.", "Manual adjustment was saved with only one leg.", ["Generate GL imbalance break"], "NAV cannot publish with unbalanced GL.", "P&L may be incomplete.", "Trial balance fails.", "No direct cash until corrected.", "Investor NAV blocked.", "GL imbalance generated.", ["Out-of-balance journal"], "Find missing journal leg.", "Add offsetting line and resubmit approval."),
    s("Accrual posted wrong", "Intermediate", "Correct account classification.", "Interest accrual posted to dividend income.", ["Create accrual classification issue"], "NAV may be unchanged but statements wrong.", "Income classification incorrect.", "Reclass journal required.", "No cash impact.", "Investor statement line items wrong.", "Accounting control break generated.", ["Missing accrual", "Accounting classification"], "Explain NAV versus statement impact.", "Post reclass journal and update audit trail."),
    s("FX revaluation missing", "Advanced", "Run FX remeasurement controls.", "Non-USD holdings were valued but FX journal missing.", ["Generate FX GL break"], "NAV may be correct but GL/TB incomplete.", "FX gain/loss missing.", "FX revaluation journal required.", "No cash impact.", "Investor reporting P&L split wrong.", "GL and FX break generated.", ["FX variance check"], "Identify missing FX entry.", "Post FX revaluation and rerun trial balance."),
    s("Performance fee reversal error", "Real World Ops", "Review fee reversal accounting.", "Prior performance fee reversal was posted twice.", ["Create fee reversal exception"], "NAV overstated if expense reversed too much.", "Performance fee expense understated.", "Fee payable wrong.", "No direct cash until crystallization.", "Investor fee allocation wrong.", "Fee validation break generated.", ["Performance fee validation", "High-water mark validation"], "Quantify duplicate reversal impact.", "Reverse erroneous entry and approve fee engine."),
    s("Expense allocation mismatch", "NAV Oversight", "Check class-level expense allocation.", "Admin fee allocated to wrong share class.", ["Create allocation mismatch"], "Total NAV may be same but class NAV wrong.", "Expense allocation by class incorrect.", "Allocation journal requires correction.", "No cash impact.", "Specific investors impacted.", "Investor allocation break generated.", ["Investor allocation mismatch"], "Explain fund-level vs class-level NAV impact.", "Reallocate expense and regenerate investor statements."),
  ],
  nav: [
    s("NAV shock due to pricing movement", "Beginner", "Explain major daily NAV move.", "Valuation file moved several high-exposure positions.", ["Apply market crash to holdings"], "NAV drops materially.", "Unrealized P&L drops.", "Fair value journals update.", "No direct cash movement.", "All investors impacted through NAV/share.", "Pricing exceptions may be generated.", ["NAV movement threshold", "Price tolerance breach"], "Explain top contributors to NAV move.", "Validate prices, document movement, and approve NAV."),
    s("Large redemption impact", "Intermediate", "Assess liquidity and investor capital impact.", "A large investor requests redemption near cutoff.", ["Add large pending redemption"], "NAV/share may not change, but liquidity and capital base change.", "No P&L impact unless fees/gates apply.", "Capital payable workflow begins.", "Cash liquidity pressure increases.", "Redeeming investor shares decrease after approval.", "Investor activity break possible.", ["Liquidity threshold alert", "Missing approval"], "Decide whether gate or approval is required.", "Validate terms, approve redemption, plan cash."),
    s("Open breaks exceed materiality", "NAV Oversight", "Determine whether NAV can be released.", "Unresolved breaks exceed materiality threshold.", ["Generate high NAV variance break"], "NAV release blocked pending resolution.", "P&L may be misstated depending break type.", "GL may require adjustment.", "Cash/position may be impacted.", "Investor statements should not publish.", "NAV variance break generated.", ["NAV movement threshold", "Missing approval"], "Decide if NAV can be published.", "Resolve or approve material breaks before release."),
    s("Prior NAV restatement", "Real World Ops", "Practice restatement workflow.", "Prior-day price error discovered after publication.", ["Create prior NAV restatement break"], "Prior and current NAV require restatement analysis.", "P&L corrected across periods.", "Adjustment journal required.", "No immediate cash impact.", "Investor statements may need reissue.", "NAV variance break generated.", ["NAV movement threshold", "Audit control"], "Explain restatement decision process.", "Quantify impact, obtain approval, communicate restatement."),
    s("NAV/share inconsistency", "Advanced", "Validate capital shares versus net assets.", "Shares outstanding do not tie to investor register.", ["Create investor share mismatch"], "NAV/share is unreliable.", "No P&L impact.", "Capital ledger tie-out required.", "No direct cash impact.", "All investor statements affected.", "Investor allocation break generated.", ["Investor allocation mismatch"], "Find shares discrepancy and correction.", "Tie capital register, update shares, republish NAV/share."),
  ],
  capital: [
    s("Late subscription after cutoff", "Beginner", "Apply subscription cutoff policy.", "Investor cash arrives after subscription cutoff.", ["Add pending subscription"], "Current NAV may exclude late capital.", "No P&L impact.", "Subscription payable/capital pending.", "Cash may be held unallocated.", "Investor shares issued next cycle.", "Investor activity break generated.", ["Cutoff breach", "Missing approval"], "Decide whether to include subscription in current NAV.", "Apply fund terms and document cutoff decision."),
    s("Redemption gate applied", "Intermediate", "Simulate liquidity gate controls.", "Investor redemption exceeds liquidity gate.", ["Add large redemption", "Create liquidity alert"], "NAV/share may remain stable but liquidity risk rises.", "No P&L impact unless liquidation costs accrue.", "Redemption payable may be limited.", "Cash forecast strained.", "Investor receives partial redemption.", "Liquidity break generated.", ["Liquidity threshold alert"], "Calculate allowed redemption amount.", "Apply gate, notify investor, update capital activity."),
    s("Equalization mismatch", "Advanced", "Review equalization accounting.", "New investor equalization credit calculated incorrectly.", ["Create equalization mismatch"], "Class/investor NAV allocation wrong.", "Performance fee allocation wrong.", "Equalization journal required.", "No direct cash impact.", "Affected investor capital account wrong.", "Investor allocation break generated.", ["Performance fee validation", "Investor allocation mismatch"], "Explain equalization purpose and correction.", "Recalculate credit and approve investor allocation."),
    s("Wrong share issuance", "Real World Ops", "Tie subscription amount to shares issued.", "Subscription shares issued using stale NAV/share.", ["Create share issuance error"], "Investor-level NAV/share and ownership wrong.", "No fund P&L impact.", "Capital register requires correction.", "Cash may be correct.", "Investor allocation materially wrong.", "Investor activity break generated.", ["Investor allocation mismatch"], "Find correct share issuance using approved NAV.", "Cancel/reissue shares and update register."),
    s("Lock-up breach", "Real World Ops", "Explain investor terms control.", "Investor requests redemption during lock-up.", ["Create lock-up exception"], "NAV unaffected until approval decision.", "No P&L impact.", "No GL until redemption accepted.", "No cash movement yet.", "Investor servicing issue.", "Workflow exception generated.", ["Missing approval", "Cutoff breach"], "State operational response and approval path.", "Reject or route exception approval per fund documents."),
  ],
  risk: [
    s("Market crash", "Crisis Simulation", "Assess portfolio shock and NAV controls.", "Equity and credit markets sell off sharply.", ["Reduce risk asset prices", "Increase option hedge"], "NAV drops with partial hedge offset.", "Unrealized P&L falls.", "Fair value postings update.", "Margin/collateral may move.", "Investors see NAV/share decline.", "Pricing and liquidity alerts generated.", ["NAV movement threshold", "Liquidity threshold alert"], "Explain drivers and control response.", "Validate prices, assess liquidity, escalate NAV oversight."),
    s("FX shock", "Advanced", "Measure currency translation risk.", "USD strengthens against major non-USD exposures.", ["Shock FX rates"], "NAV changes through FX translation.", "FX gain/loss moves.", "FX revaluation journal updates.", "No cash unless hedges settle.", "Investors exposed to currency movement.", "FX variance alerts generated.", ["FX variance check"], "Identify currencies driving NAV move.", "Validate WM rates and hedge exposure."),
    s("Interest rate hike", "Advanced", "Trace rates impact across bonds and IRS.", "Rates rise and affect bonds and swaps.", ["Reduce bond value", "Update IRS MTM"], "NAV moves through fixed income and derivatives.", "Unrealized P&L and OTC MTM move.", "Fair value and derivative journals update.", "Collateral/margin may change.", "Investors see rate sensitivity.", "Risk exception generated.", ["Counterparty exposure breach"], "Explain bond and swap directionality.", "Review duration, collateral and pricing evidence."),
    s("Counterparty default", "Crisis Simulation", "Review PB/OTC exposure controls.", "A derivative counterparty defaults and collateral recovery falls.", ["Reduce collateral", "Lower MTM recovery"], "NAV drops from counterparty exposure.", "OTC loss increases.", "Derivative asset impaired.", "Collateral cash/security impaired.", "Investors absorb loss.", "Counterparty break generated.", ["Counterparty exposure breach"], "Quantify exposure and escalation urgency.", "Escalate to risk committee and impair exposure."),
    s("Liquidity run", "NAV Oversight", "Simulate redemption pressure.", "Multiple investors request redemption at once.", ["Add redemption run"], "NAV/share may stay similar, liquidity worsens.", "Potential liquidation cost accrual.", "Capital payable increases.", "Cash forecast stressed.", "Redeeming/remaining investors impacted differently.", "Liquidity and investor breaks generated.", ["Liquidity threshold alert"], "Decide gating and liquidity action.", "Apply fund terms and prepare liquidity plan."),
  ],
};

function s(name: string, difficulty: ScenarioDifficulty, objective: string, context: string, changes: string[], nav: string, pnl: string, gl: string, cash: string, investor: string, recon: string, controls: string[], task: string, resolution: string): ScenarioSeed {
  return { name, difficulty, objective, context, changes, nav, pnl, gl, cash, investor, recon, controls, task, resolution };
}

const aliases: Record<string, ModuleId> = {
  capital: "capital",
  subsReds: "capital",
  stress: "risk",
  scenario: "risk",
};

export const scenarioCatalog: ScenarioDefinition[] = Object.entries(seeds).flatMap(([moduleKey, rows]) => {
  const module = moduleKey as ModuleId;
  return rows.map((row, index) => ({
    id: `SCN-${module.toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
    scenarioName: row.name,
    module,
    difficulty: row.difficulty,
    fundType: moduleFundType[module] ?? "Hedge Fund",
    objective: row.objective,
    businessContext: row.context,
    operationalBackground: "The learner is acting as fund accounting/NAV operations analyst responsible for diagnosing source data, controls, accounting treatment and NAV release readiness.",
    dataChanges: row.changes,
    affectedTables: tableMap[module] ?? ["NAV Package", "Audit Trail", "Exception Management"],
    expectedNAVImpact: row.nav,
    expectedPnLImpact: row.pnl,
    expectedGLImpact: row.gl,
    expectedCashImpact: row.cash,
    expectedInvestorImpact: row.investor,
    expectedReconciliationImpact: row.recon,
    expectedControlBreaks: row.controls,
    materialityLevel: row.difficulty === "Crisis Simulation" || row.difficulty === "NAV Oversight" ? "Critical" : row.difficulty === "Advanced" || row.difficulty === "Real World Ops" ? "High" : row.difficulty === "Intermediate" ? "Medium" : "Low",
    learnerTask: row.task,
    hints: [
      "Start from the changed source table, then follow NAV, GL, reconciliation and investor allocation impact.",
      "Separate timing differences from economic breaks before proposing a journal.",
      "Check whether materiality, cutoff or approval controls block NAV publication.",
    ],
    aiCopilotExplanation: `Guide the learner to investigate ${row.name}: ask what changed, which control failed, whether the item is timing or economic, then explain accounting and NAV dependencies.`,
    expectedResolution: row.resolution,
    passFailRules: [
      "Identifies source module and affected record.",
      "Quantifies or correctly describes NAV/P&L impact.",
      "Names failed control and required approval.",
      "Provides operationally realistic resolution evidence.",
    ],
    scoreWeightage: row.difficulty === "Beginner" ? 10 : row.difficulty === "Intermediate" ? 15 : row.difficulty === "Advanced" ? 20 : row.difficulty === "Real World Ops" ? 25 : row.difficulty === "NAV Oversight" ? 30 : 35,
    resetRules: ["Use Reset Book to restore base data.", "Scenario runs remain in completion history until full reset."],
  }));
});

export function scenariosForModule(module: ModuleId) {
  const mapped = aliases[module] ?? module;
  return scenarioCatalog.filter((scenario) => scenario.module === mapped || scenario.module === module);
}

export function createImpactSnapshot(params: {
  holdings: Holding[];
  trades: Trade[];
  fxRates: FxRate[];
  investors: Investor[];
  activities: CapitalActivity[];
  accruals: any[];
  derivatives: Derivative[];
  managementFeePct: number;
  performanceFeePct: number;
  breaks: BreakItem[];
}) : ImpactSnapshot {
  const r = recalculate(params);
  return {
    nav: r.netAssets,
    navPerShare: r.navPerShare,
    pnl: r.pnl.reduce((sum, line) => sum + line.amount, 0),
    cash: params.activities.reduce((sum, a) => sum + (a.type === "Subscription" ? a.amount : -a.amount), 0),
    investorCapital: r.investorCapital,
    openBreaks: params.breaks.filter((b) => !["Approved", "Closed"].includes(b.status)).length,
    exceptions: r.exceptions.filter((e) => e.status !== "Cleared").length,
    timestamp: new Date().toISOString(),
  };
}

export function applyScenarioEffect<T extends {
  holdings: Holding[];
  trades: Trade[];
  fxRates: FxRate[];
  investors: Investor[];
  activities: CapitalActivity[];
  derivatives: Derivative[];
  breaks: BreakItem[];
}>(state: T, scenario: ScenarioDefinition): Pick<T, "holdings" | "trades" | "fxRates" | "investors" | "activities" | "derivatives" | "breaks"> {
  let holdings = state.holdings;
  let trades = state.trades;
  let fxRates = state.fxRates;
  let investors = state.investors;
  let activities = state.activities;
  let derivatives = state.derivatives;
  const breakType = scenario.module === "cashRecon" ? "Cash" : scenario.module === "positionRecon" ? "Position" : scenario.module === "pricing" || scenario.module === "holdings" ? "Pricing" : scenario.module === "corporateActions" ? "Corporate Action" : scenario.module === "trades" ? "Trade Settlement" : scenario.module === "gl" ? "GL Imbalance" : "NAV Variance";

  if (scenario.module === "holdings" || scenario.scenarioName.includes("Market crash") || scenario.scenarioName.includes("NAV shock")) {
    holdings = holdings.map((h) => {
      if (scenario.scenarioName.includes("FX")) return h;
      if (scenario.scenarioName.includes("Short") && h.ticker !== "AAPL") return h;
      if (scenario.scenarioName.includes("Bond") && h.assetType !== "Bond") return h;
      if (scenario.scenarioName.includes("Stale") && h.assetType !== "Option") return h;
      const multiplier = scenario.scenarioName.includes("Short") ? 1.12 : scenario.scenarioName.includes("Bond") ? 1.015 : scenario.scenarioName.includes("Stale") ? 1 : 0.88;
      return { ...h, priorPrice: h.marketPrice, marketPrice: Number((h.marketPrice * multiplier).toFixed(4)), lastPriceTime: scenario.scenarioName.includes("Stale") ? "2026-05-09T09:00:00" : h.lastPriceTime };
    });
  }

  if (scenario.scenarioName.includes("FX")) {
    fxRates = fxRates.map((fx) => ({ ...fx, priorRate: fx.rate, rate: Number((fx.rate * (fx.base === "USD" ? 1 : 0.94)).toFixed(6)) }));
  }

  if (scenario.module === "trades") {
    trades = trades.map((t, index) => index === 0 ? { ...t, fees: scenario.scenarioName.includes("commission") ? t.fees * 10 : t.fees, status: scenario.scenarioName.includes("Failed") ? "Failed" : t.status, side: scenario.scenarioName.includes("buy/sell") ? (t.side === "Buy" ? "Sell" : "Buy") : t.side } : t);
    if (scenario.scenarioName.includes("Duplicate")) trades = [...trades, { ...trades[0], id: `${trades[0].id}-DUP`, status: "Pending" }];
  }

  if (scenario.module === "capital" || scenario.scenarioName.includes("redemption") || scenario.scenarioName.includes("subscription") || scenario.scenarioName.includes("Liquidity run")) {
    activities = [...activities, { id: `cap-${crypto.randomUUID().slice(0, 8)}`, investorId: "i2", date: "2026-05-09", type: scenario.scenarioName.toLowerCase().includes("subscription") ? "Subscription" : "Redemption", amount: scenario.scenarioName.includes("Large") || scenario.scenarioName.includes("run") ? 12_500_000 : 2_750_000, status: "Pending" }];
  }

  if (scenario.scenarioName.includes("Interest rate") || scenario.scenarioName.includes("Counterparty")) {
    derivatives = derivatives.map((d) => ({ ...d, mtm: d.mtm - (scenario.scenarioName.includes("Counterparty") ? 900_000 : 260_000), collateral: scenario.scenarioName.includes("Counterparty") ? d.collateral * 0.55 : d.collateral }));
  }

  if (scenario.scenarioName.includes("Wrong share") || scenario.scenarioName.includes("Equalization")) {
    investors = investors.map((i, index) => index === 1 ? { ...i, shares: Math.round(i.shares * 1.08), equalizationCredit: i.equalizationCredit * 0.75 } : i);
  }

  const generatedBreak: BreakItem = {
    id: `SCN-BRK-${Math.floor(1000 + Math.random() * 9000)}`,
    breakType,
    severity: scenario.materialityLevel === "Critical" || scenario.materialityLevel === "High" ? "High" : scenario.materialityLevel === "Medium" ? "Medium" : "Low",
    aging: scenario.difficulty === "Beginner" ? 0 : scenario.difficulty === "Intermediate" ? 1 : 3,
    owner: scenario.module === "pricing" || scenario.module === "holdings" ? "Valuations" : scenario.module === "cashRecon" ? "Treasury" : scenario.module === "gl" ? "Fund Accounting" : "Ops L2",
    navImpact: scenario.materialityLevel === "Critical" ? 2_500_000 : scenario.materialityLevel === "High" ? 850_000 : scenario.materialityLevel === "Medium" ? 150_000 : 25_000,
    rootCause: `${scenario.scenarioName}: ${scenario.expectedReconciliationImpact}`,
    status: "Open",
    resolutionNotes: "Scenario-generated break. Learner must investigate, evidence and resolve.",
    escalationLevel: scenario.materialityLevel === "Critical" ? "CFO" : scenario.materialityLevel === "High" ? "L3" : scenario.materialityLevel === "Medium" ? "L2" : "L1",
    comments: [`Practice scenario ${scenario.id} started`, scenario.learnerTask],
    slaHours: scenario.materialityLevel === "Critical" ? 4 : scenario.materialityLevel === "High" ? 8 : 24,
  };

  return { holdings, trades, fxRates, investors, activities, derivatives, breaks: [generatedBreak, ...state.breaks] };
}

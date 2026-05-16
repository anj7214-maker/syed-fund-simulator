# SYED FUND SIMULATOR Tab Implementation Map

## Source Files

- `src/App.tsx` - all visible tabs, sidebar routing, tables, charts, auth gate, submit controls, export buttons.
- `src/store/fundStore.ts` - centralized Zustand state, edit actions, scenarios, audit event creation, IndexedDB persistence.
- `src/engine/recalc.ts` - NAV recalculation engine, GL postings, trial balance, P&L, balance sheet, fee accruals, exceptions, exposures.
- `src/data/sampleData.ts` - institutional sample holdings, trades, FX rates, investors, subscriptions/redemptions, accruals, derivatives, exceptions.
- `src/types.ts` - TypeScript models for holdings, trades, currencies, investors, GL, audit, exceptions, recalculation output, module ids.
- `src/styles.css` - Bloomberg-style dark UI, grids, tables, auth screen, manual-submit controls, responsive layout.
- `src/main.tsx` - Clerk provider, React Query provider, missing-auth-config fallback.

## Global Capabilities

- Clerk login with approved-email gate.
- Zustand centralized state with IndexedDB persistence.
- Real-time recalculation after edits.
- Flashing edited cells and dependency strip.
- Audit trail for manual changes.
- Scenario shocks for market, FX, redemption, rates, and counterparty events.
- Compact money format using K/M/B/T display.
- Manual submit workflow bars on editable modules.
- Phase 2 upload ingestion for CSV, JSON, and XLSX simulation metadata.
- Upload history with timestamp, uploaded by, source filename, row counts, warnings, rejected rows, duplicate records.
- File validation issues with Info, Warning, Critical severity.
- System-generated breaks from upload warnings and rejects.
- Centralized AI Copilot side panel with contextual explanations and Learning Mode.
- Break lifecycle actions: assign owner, update notes, escalate, resolve, approve, reopen.

## Sidebar Tabs

| Tab | What It Does | Source Component |
| --- | --- | --- |
| Executive Dashboard | Shows gross assets, liabilities, NAV, unrealized P&L, open exceptions, NAV waterfall, strategy exposure, scenario controls. | `Dashboard` |
| Fund Master Setup | Editable fund setup module with legal/entity terms, service providers, fee setup, valuation cutoff, share classes, and maker-checker workflow. | `FundMasterSetup` |
| Portfolio Holdings | Editable holdings table with quantity, cost price, market price, market value, unrealized G/L, exposure %, counterparty, settlement date. | `HoldingsGrid` |
| Trade Blotter | Editable trade booking blotter with quantity, price, fees, net amount, status, trade id. Auto-feeds GL. | `TradeBlotter` |
| Security Master | Institutional security master with Bloomberg ticker, asset type, country, exchange, pricing source, valuation hierarchy, liquidity, derivative terms, stale/tolerance flags. | `SecurityMasterView` |
| Editable Fields & Controls | Lists every amendable field and the downstream accounting/NAV impact. | `EditableFieldsView` |
| Pricing Engine | Manual price override console with source, prior price, current price, move %, stale/variance review flag. | `PricingEngine` |
| FX Rates | Editable FX matrix against USD, including major currencies: EUR, GBP, JPY, INR, CHF, SGD, CAD, AUD, NZD, HKD, CNH, SEK, NOK, DKK, ZAR, BRL, MXN, KRW. | `FxEngine` |
| Cash Reconciliation | Reconciles internal ledger cash to custodian and prime broker cash by currency, difference, owner, status, and break reason. | `CashReconciliationView` |
| Position Reconciliation | Reconciles internal positions to custodian and PB positions, settlement status, difference, owner, and break reason. | `PositionReconciliationView` |
| Reconciliation Breaks | Combined cash and position break register with break ID, aging, root cause, NAV impact, SLA. | `ReconciliationBreaks` |
| Corporate Actions | Corporate action processing engine for dividends, coupons, splits, rights issues, posting status, accrual/NAV impact. | `CorporateActionsView` |
| Dividend Accruals | Dividend accrual table with ex-date, pay-date, shares eligible, withholding tax, net dividend. | `AccrualsView` |
| Coupon Accruals | Coupon accrual table with coupon %, accrual days, accrued interest, clean/dirty price. | `AccrualsView` |
| OTC Derivatives | Separates notional, MTM, gross exposure, net exposure, PFE, collateral, ISDA threshold, margin utilization, haircut and counterparty exposure. | `DerivativesView` |
| Swaps & Futures MTM | Same MTM and counterparty exposure engine for valuation impacts. | `DerivativesView` |
| General Ledger | Double-entry journal output for trades, accruals, fees, FX/fair value, derivative MTM. | `GLView` |
| Trial Balance | Aggregates GL lines by account with debit, credit, balance, and balanced/out-of-balance status. | `TrialBalance` |
| P&L Statement | Sectioned institutional statement: income, expenses, gross income, total expenses, net investment income, net profit/loss. | `Statements("pl")` |
| Balance Sheet | Sectioned assets, liabilities, capital with subtotals and validation. | `Statements("balance")` |
| NAV Package | Core NAV view with gross assets, liabilities, net assets, investor capital, shares, NAV/share, HWM, equalization, fee accruals, waterfall. | `Statements("nav")` |
| Investor Capital Activity | Editable investor capital, shares, HWM and allocation %. | `InvestorView` |
| Subscriptions & Redemptions | Investor/capital workflow view backed by capital data and NAV allocation. | `InvestorView` |
| Management Fee Engine | Editable management fee %, daily accrual logic, investor allocation table. | `InvestorView(fees)` |
| Performance Fee Engine | Editable performance fee %, HWM/equalization-linked fee display. | `InvestorView(fees)` |
| Equalization Accounting | Investor allocation/equalization view. | `InvestorView` |
| Waterfall Allocation | Investor allocation workflow view. | `InvestorView` |
| Expense Allocation | Fee/expense workflow view. | `InvestorView(fees)` |
| Audit Trail | Shows changed field, old/new value, timestamp, impacted module count, action. | `AuditTrail` |
| Exception Management | Centralized break management dashboard with assignment, SLA, escalation, resolution notes, and status workflow. | `BreaksDashboard` |
| Risk & Exposure | Strategy exposure bar chart from live holdings. | `ReconRiskOps("risk")` |
| Stress Testing | Scenario buttons for market crash, FX shock, redemption run, rate hike, counterparty default. | `ReconRiskOps("stress")` |
| Scenario Simulation | Same scenario control surface for applying shocks across modules. | `ReconRiskOps("scenario")` |
| Investor Reporting | Investor allocation/reporting worksheet. | `InvestorView` |
| Financial Statements Export | CSV export buttons for NAV pack, investor statement, trial balance, P&L, balance sheet. | `ExportView` |
| Workflow Approval Queue | Maker-checker workflow queue with Save Draft, Submit, Approve, Reject, Post, Publish NAV controls. | `WorkflowQueue` |
| Operations Control Dashboard | NAV status, GL status, open breaks, approval queue and exception panel. | `ReconRiskOps("ops")` |

## Editable Fields

| Module | Editable Fields |
| --- | --- |
| Portfolio Holdings | Quantity, Cost Price, Market Price |
| Pricing Engine | Current Market Price |
| FX Rates | FX Rate by currency pair |
| Trade Blotter | Quantity, Price, Fees |
| Investor Capital Activity | Capital, Shares, High Water Mark |
| Management Fee Engine | Management Fee % |
| Performance Fee Engine | Performance Fee % |
| OTC Derivatives / MTM | MTM, Accrued Interest, Collateral |

## Upload-Enabled Modules

| Module | Supported Uploads | Processing Simulation |
| --- | --- | --- |
| Cash Reconciliation | Internal cash ledger, custodian cash statement, prime broker cash file | Currency matching, tolerance checks, timing difference detection, cash break generation |
| Position Reconciliation | Internal positions, custodian positions, PB positions | Quantity comparison, settlement-status logic, missing/stale position checks |
| Trade Blotter | Executed trades, broker confirms, OMS exports | Normalization, duplicate detection, settlement validation, GL posting workflow |
| Security Master | Security reference data, Bloomberg exports, pricing source files | Duplicate/missing identifier checks, invalid currency controls, stale reference validation |
| Pricing Engine | Vendor prices, NAV prices, evaluated prices, FX pricing sheets | Stale pricing, tolerance validation, prior-day variance, price challenge workflow |
| Corporate Actions | Dividend files, announcements, coupon schedules | Entitlement, withholding tax, receivable/accrual generation, settlement tracking |
| Investor Capital Activity | Subscriptions, redemptions, allocations, transfer agency files | Capital allocation, share issuance, equalization/HWM/liquidity validation |

## AI Copilot

- `CopilotPanel` is embedded inside the dashboard shell.
- `ExplainButton` sends selected row/upload/break context to the copilot.
- `Learning Mode` highlights workflow guidance and explains operational best practices.
- Copilot context includes current tab, accounting impact, NAV impact, recommended action, and related entries.
- Phase 3 conversational chat adds typed questions, chat history, timestamps, typing indicator, tab-aware suggested prompts, Professional/Learning response modes, and dynamic replies from live Zustand/recalc state.
- The local response service reads active tab, NAV, holdings, breaks, uploads, workflow status, fees, corporate actions, GL and selected copilot context.

## Recalculation Engine Outputs

- Holdings market value and unrealized gain/loss.
- Gross exposure and exposure percentages.
- FX gain/loss.
- Dividend and coupon income.
- Management and performance fee accruals.
- Auto-generated GL entries.
- Trial balance.
- P&L.
- Balance sheet.
- NAV/share.
- NAV waterfall.
- Strategy exposure chart.
- Exceptions and audit history.

# Real Estate Fund Accounting: QC and User SOP

## Release Scope

This is the first working, separately scoped Real Estate Fund Accounting workspace in FundOps Lab. It adds one main navigation entry and 22 internal tabs without changing the hedge-fund calculation engine or operating books.

It is not the complete advanced-policy implementation described in the master brief. Unsupported features are listed below and in the application. There are no claims of administrator endorsement, full IFRS compliance, production security or certified assessment.

## Accounting Model

- One synthetic USD-reporting fund; four wholly owned SPVs; four investment properties.
- Three USD SPVs and one EUR SPV. One property and one loan per SPV in this release.
- 24 fictional tenant leases; 101 baseline source transactions.
- Open demonstration period: September 1-30, 2026.
- Consolidated non-investment-entity example; IAS 40 fair-value property model.
- Opening fund investments and matching SPV equity are eliminated in consolidation. Intercompany funding eliminates on aggregation.
- Rental billing, receipts, supplier accruals/payments, capex, loans, dated Actual/365 interest, management fees, contributions and declared/paid distributions use a double-entry ledger.
- Capital calls are memorandum notices until received. No capital-call receivable is recognized in this selected policy.
- Monthly earnings, including fees, and FX translation are allocated using opening-capital weights. Rounding residual goes to the final investor so allocations conserve the total.
- Approved property valuations produce accounting movements relative to carrying value. Capital expenditure does not automatically change the approved appraisal.
- Each local TB balances. Presentation-currency translation reserves are derived separately from closing translated assets/liabilities, historical equity and recorded-rate P&L.
- Monetary postings use integer minor units with checked ranges; rates are applied with rounding to minor units.

Clean baseline USD results:

| Metric | Amount |
| --- | ---: |
| Opening attributable NAV | 34,800,000.00 |
| Period P&L after management fee | 210,754.21 |
| Closing attributable NAV | 35,010,754.21 |
| Consolidated cash | 6,454,877.50 |
| Implemented control exceptions | 0 |

## Operating Areas

| Group | Functional tabs |
| --- | --- |
| Setup | Overview & Close; Fund & Entity Structure; Property Register |
| Property | Rent Roll & Receivables; Property Expenses & Capex; Cash & Bank Reconciliation |
| Valuation & Debt | Debt & Interest; Valuation & Performance |
| Investors | Capital Calls & Distributions; Investor Accounting; Fees & Waterfall |
| Accounting & NAV | Intercompany & FX; Consolidation; Journals & General Ledger; Trial Balance; NAV Working & Movement Bridge; Financial Statements |
| Controls & Practice | Exceptions & Controls; Approvals & Audit; File Uploads & Exports; Sandbox Scenarios; Practice Resources |

Consolidated dashboards and investor reports retain the complete fund scope. Entity-filtered transaction, GL, property and debt views support investigation. Local and USD values are explicitly labelled; do not sum different functional currencies.

## Starting a Session

1. Open FundOps Lab and choose **Real Estate Fund Accounting**.
2. Confirm the real estate-specific header shows Meridian Real Estate Fund, its own NAV, the accounting date and the correct environment.
3. Select **Sandbox** for practice. Its book is independent of Live and hedge-fund data.
4. Start as **Analyst**. The role selector represents simulated actor identities, not authenticated real-world authority.
5. Review Overview & Close, then the entity hierarchy and accounting policy.
6. Follow source IDs from operational schedules into journals, TB, consolidation, NAV and investor capital. Table filters, sortable headers and Trace actions support investigation.

## Preparing an Accounting Change

1. Open the relevant operating tab. Use its transaction action or **Raise correction** on an existing source record.
2. Enter the entity, local amount, in-period date, relevant property/investor/loan, source reference, reason and evidence reference.
3. For receipts and payments, select the matching posted invoice/accrual/declaration. An amount greater than the remaining outstanding source balance is rejected.
4. Choose **Save proposal & recalculate preview**.
5. Compare posted NAV with projected NAV, the proposed NAV/P&L/cash effects and validation messages. Invalid proposals are excluded from the preview and identified.
6. Posted accounting is unchanged. Review the proposal through Approvals & Audit before posting.

An amendment to a posted transaction becomes a new proposal under the same source ID. Posting reverses the old journal and records the replacement. Posted journals themselves remain visible and are not silently overwritten.

## Four-Eyes Workflow

1. Analyst prepares a proposal and clicks **Submit**.
2. Switch the demonstration actor to **SME** and click **Review**.
3. Switch to **Controller** and click **Approve**, then **Post to GL**.
4. Inspect the posted journals, local TB, financial statements, NAV bridge and investor allocation.
5. If the maker is also the Controller, another actor must perform the correction/approval flow; self-review and self-approval are rejected by the simulation engine.
6. Rejected proposals can be amended. Submitted/reviewed/approved proposals are locked against editing until the permitted rejection/correction workflow is used.
7. For posted corrections, use **Raise correction**, not repeated posting. Duplicate posting transitions are rejected.

Role selection is a local simulation. There is no server-side real estate authentication or enterprise approval service in this release.

## Cash and NAV Are Different

- A rent invoice increases receivables and income; cash does not move.
- Receipt of an already accrued invoice converts receivables into cash; it does not recognize income or increase NAV a second time.
- Supplier expense accrual decreases NAV; paying the payable affects cash but not expense again.
- A loan drawdown increases cash and debt, not income or NAV.
- Principal repayment decreases cash and debt, not period expense.
- Capex exchanges cash for a property asset. An approved valuation must subsequently support the carrying amount.
- Contributions increase cash and investor capital. A capital-call notice alone does not.
- Distribution declaration reduces investor capital and creates a payable. Payment clears the payable without reducing NAV again.

Bank statement values are independent observations. Recording an external statement balance does not modify GL cash. A zero numeric difference updates the reconciliation to Matched, but does not publish NAV.

## Sandbox Incidents

Six incident workflows are available:

| Incident | Investigation and resolution |
| --- | --- |
| Unallocated rent receipt | Bank exceeds ledger; restore the receipt against its posted rent invoice, then review/post. NAV should not increase again. |
| Property valuation decline | Target appraisal is below carrying value; prepare a valuation proposal, attach evidence, review and post the loss. |
| Missing loan interest | Recalculate dated Actual/365 interest and restore the missing accrual. |
| Incorrect management fee | Tie committed capital, rate and accrual period to the posted expense; prepare the required correction. |
| Stale appraisal | Prepare a valuation approval with current evidence; even unchanged value requires the evidence workflow. |
| Duplicate source file | Download source records and attempt re-import; duplicate IDs must be rejected without journals. |

Procedure:

1. Open Sandbox Scenarios and choose an incident.
2. Click **Start investigation**. A new incident cannot replace an active scenario or pending proposals without an explicit reset.
3. Read the objective and open the affected operating screen.
4. Investigate sources and controls. A hint is available on request.
5. Prepare and process the required accounting proposal with a different reviewer.
6. Return to the scenario and record a finding covering root cause, accounting, impact, evidence and escalation.
7. The result checks implemented controls and finding presence. It does not automatically validate the quality of written reasoning or issue certification.
8. Download Session evidence if required.
9. **Reset Sandbox** restores the clean real estate baseline after confirmation. It never resets Live or hedge-fund books.

## Fees and Waterfall

The fee working shows actual posted fund-level expense/payable and fund-level payments, compared with committed-capital Actual/365 expectation. Investor expense allocations use actual GL expense and opening-capital weights, with the rounding residual assigned to the last investor; they tie exactly to the ledger. A missing fee therefore shows zero posted allocation, not the expected charge. Investor-level paid-fee history is not separately tracked and is labelled accordingly.

The waterfall is a separately labelled sensitivity, not an automatic accounting posting:

1. Return LP/GP unreturned capital pro rata if proceeds are insufficient.
2. Pay a simple preferred return to LPs.
3. Allocate a catch-up pool using the GP catch-up allocation rate and target carry share.
4. Split residual proceeds between LP and GP.

Change proceeds, capital, rate, period, carry and catch-up inputs to compare outputs. LP plus GP allocations conserve proceeds. The sensitivity assumes no prior distributions, clawback or deal-by-deal mechanics. Actual distributions require separate posted transactions and sufficient funding.

## File Ingestion

1. Download the transaction template.
2. Supply CSV, JSON or XLSX transaction rows with its exact headers. Amounts are major local-currency units, converted to minor units on import.
3. XLSX selects the Transactions sheet when present, otherwise the first worksheet; dates must be ISO text. Formula cells, external worksheet references, encrypted files and unsafe archives are rejected.
4. File limit is 2 MB; expanded XLSX limit is 10 MB; maximum 1,000 imported transactions.
5. Upload and inspect the preview and row-specific errors.
6. Fix all errors. **Confirm validated import** is disabled when errors exist.
7. Confirmation atomically creates draft proposals, not posted journals. Revalidate the batch against the current book and combined projected transactions before accepting it.
8. Process approvals/posting separately.

Dedicated property-manager TB, lease, valuation and bank file mapping is not implemented; the transaction template is the supported ingestion contract. No SFTP or external financial-system connection is provided.

## Excel NAV Pack

The workbook includes Entities, Journals, Trial Balance, NAV Working, Investor Capital, Control Checks, Property Register, Rent Roll, Bank Recon, Debt, Transactions, Audit and Policy.

Journal amounts and entity FX inputs feed formulas for historical/closing translated values, TB, consolidation/NAV and investor capital. Bank differences are formula linked. Source registers, debt expectation and audit/policy schedules are support snapshots, not independent posting engines.

Edit Excel journal/FX inputs to explore financial aggregate changes. The workbook does not execute transaction recognition, corrections, approvals, application scenarios or posting rules. Editing a raw transaction snapshot does not regenerate its journal. Re-uploading an export does not overwrite application accounting; existing transaction IDs are rejected.

## QC Evidence

| Test area | Result |
| --- | --- |
| Automated engine/store/import/export checks | 46 passed via `node scripts/test-real-estate.mjs` |
| Clean baseline GL/TB/NAV/bridge/investor controls | Passed, no unexplained residuals |
| Rent/accrual/payment/debt/capital/distribution effects | Passed |
| Reversal/replacement and duplicate posting prevention | Passed |
| Maker-checker and closed-period restrictions | Passed in local simulation |
| FX translation and intercompany elimination | Passed |
| Waterfall conservation including insufficient proceeds | Passed |
| Browser smoke test | All 22 internal tabs rendered; no console errors during that pass |
| Browser valuation workflow | Analyst proposal -> SME review -> Controller approval/post; NAV moved from USD35,010,754.21 to USD33,810,754.21 |
| Browser environment isolation | Live remained USD35,010,754.21; corrected Sandbox remained USD33,810,754.21 |
| Fresh release browser pass, October 12 | All 22 internal tabs rendered again, no browser errors; investor table filter/sort verified |
| Existing hedge-fund navigation regression, October 12 | All 45 existing module entries rendered with matching headers and visible main content; no browser errors during the pass. No hedge-fund accounting transactions were posted; this is not a complete calculation/API regression. |
| Missing-fee workflow, October 12 | Missing accrual raised Sandbox NAV to USD35,096,562.43; Analyst -> SME -> Controller posting restored USD35,010,754.21 and zero controls; investor fee allocations tied to USD85,808.22 |
| Live-only restrictions, October 12 | No Reset Sandbox control in Live; incident injection unavailable in Live; Live book remained unchanged |
| XLSX ingestion | Downloaded NAV Pack transaction sheet parsed; duplicate IDs rejected; confirmation disabled |
| Spreadsheet engine recalculation | Downloaded corrected pack imported into artifact-tool; EUR closing rate changed to 1.2; NAV became USD34,618,728.97, historical P&L unchanged, investor residual zero |
| TypeScript | Passed |
| Restricted-runner verification bundle | Built successfully using TypeScript/Vite without unavailable compiler subprocesses |
| Standard production build | Windows runner subprocess restriction; rerun `npm.cmd run build` in ordinary CMD/Vercel before release |
| Responsive inspection | Desktop and narrow browser viewport inspected; no page-wide horizontal overflow in the observed narrow layout |

Browser requested 390px but the connected Chrome surface reported a 520px viewport. True 320/360/390px device checks remain outstanding; do not interpret the narrow-browser pass as a physical-phone test.

The verification server uses a local mock registration endpoint with synthetic QC details only. It does not store or send visitor data externally. This is not a verification of production registration or API availability.

## Known Gaps Against the Full Master Brief

- Investment-entity FVTPL model, NCI, joint ventures, hybrid/cost models and development accounting.
- Intra-period investor equalization/time weighting, investor-level fee payment attribution and complete historical capital/performance series.
- Full lease-incentive recognition, service-charge/tax engines, property acquisitions/disposals and automatic performance metrics.
- Contractual DSCR schedules, effective-interest loan fees, derivatives and hedge accounting.
- Detailed historical or deal-by-deal waterfall, catch-up accrual postings, clawback and partner-level distribution history.
- Dedicated source-file mapping for each master/subledger and bank feed.
- The remaining incidents from the master scenario list beyond the six implemented workflows.
- Full IAS 7 cash-flow statement; the tab currently provides posted cash movements.
- Fully linked Excel support registers, workbook cell protection and app-equivalent posting calculations inside Excel.
- Backend persistence, authenticated RBAC, server-enforced approval, cryptographic immutable audit and corporate client-data security.
- Complete device-size and existing hedge-fund automated regression suite.

These are intentionally visible limitations, not implemented features or certification claims.

## Running and Publishing

Normal development: `npm.cmd run dev` and the existing registration API where required.

Restricted local QC: `node scripts/verify-real-estate-build.mjs --serve`. It builds a separate ignored `.verification-dist` and serves localhost:5174 with a mock registration endpoint. Never deploy that verification output as production.

Use the scoped `deploy-real-estate.cmd` only after reviewing the documented limitations. It runs engine QC and the normal production build before committing/pushing relevant files. Confirm Vercel Ready and verify the production workspace before claiming deployment.

October 12 release attempt: TypeScript, 46 tests and the verification bundle passed. The standard build failed inside the restricted Codex runner with `spawn EPERM`; Git staging also failed because `.git/index.lock` could not be created. No Real Estate release commit was pushed or deployed by that attempt. Run the scoped deployment script in ordinary Command Prompt, then verify Vercel's production build and exact commit.

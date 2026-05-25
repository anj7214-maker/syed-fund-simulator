# SYED FUND SIMULATOR

## Scenario Simulation Standard Operating Procedure

### Purpose

This SOP explains how to use the Scenario Simulation module in SYED FUND SIMULATOR.

Scenario Simulation is designed to help users practice realistic hedge fund operations issues and understand how one operational event affects the full NAV lifecycle.

The module is useful for:

- Fund accounting training
- NAV operations training
- Reconciliation practice
- Pricing validation training
- Investor servicing training
- Interview preparation
- Operational risk awareness
- Understanding downstream accounting impact

The key learning objective is:

One operational issue can affect holdings, cash, positions, GL, P&L, balance sheet, NAV, investor allocation, audit trail, and NAV approval.

---

## 1. What Scenario Simulation Means

Scenario Simulation is a controlled practice environment where the system introduces a realistic fund operations issue.

Examples:

- A stale price is loaded.
- A cash receipt is missing.
- A custodian position does not match internal records.
- A dividend accrual is missing.
- A trade is booked with the wrong buy/sell flag.
- Investor capital is booked incorrectly.
- FX rate changes materially.
- A journal is out of balance.

The user investigates the issue, reviews impacted tabs, makes manual changes if required, submits the update, and observes the NAV impact.

---

## 2. When to Use Scenario Simulation

Use Scenario Simulation when you want to practice:

- How NAV moves
- Why breaks occur
- How accounting entries are generated
- How reconciliation issues are investigated
- How pricing issues affect NAV
- How investor capital affects NAV/share
- How operational controls block NAV release
- How audit trail records changes

Recommended users:

- Students learning fund accounting
- New fund accounting analysts
- NAV operations analysts
- Reconciliation analysts
- Interview candidates
- Operations professionals moving into hedge fund administration

---

## 3. Recommended Mode

Use Scenario Simulation in **Sandbox Mode**.

Sandbox Mode is intended for practice and experimentation.

Do not use Live Mode for practice scenarios unless you only want to review the clean operational book.

Before starting:

1. Open the simulator.
2. Confirm the top header shows **Sandbox**.
3. If it shows Live Mode, click the mode button to switch to Sandbox.
4. Click **Reset book** if you want to start from original sample data.

---

## 4. Scenario Simulation Navigation

### How to Open Scenario Simulation

1. Go to the left sidebar.
2. Scroll down if needed.
3. Click **Scenario Simulation**.

The screen will show the active operational scenario.

Typical scenario fields:

- Scenario name
- Severity
- Objective
- Business context
- Expected impact
- Learner task
- Hints or AI guidance
- Start Investigation button
- Reset Scenario or Reset Book button

---

## 5. Scenario Simulation Workflow

Follow this workflow every time.

### Step 1: Reset the Book

Click **Reset book** before starting a new scenario.

Purpose:

- Restores original sample data
- Clears prior practice impact
- Makes before/after comparison cleaner

### Step 2: Confirm Sandbox Mode

Confirm the top header shows **Sandbox**.

Purpose:

- Ensures you are practicing safely
- Makes the workflow training-focused

### Step 3: Open Scenario Simulation

Click **Scenario Simulation** from the left sidebar.

### Step 4: Read the Scenario Carefully

Review:

- Scenario name
- Business context
- Operational background
- Expected NAV impact
- Expected P&L impact
- Expected reconciliation impact
- Learner task

Do not immediately change numbers. First understand what the issue is asking you to investigate.

### Step 5: Click Start Investigation

Click **Start Investigation**.

This activates the scenario context and tells the simulator that you are investigating an operational issue.

### Step 6: Identify the Source Module

Determine which tab is the likely source of the issue.

Use this guide:

| Scenario Type | Source Module |
|---|---|
| Price issue | Pricing Engine or Portfolio Holdings |
| FX issue | FX Rates |
| Trade issue | Trade Blotter |
| Cash issue | Cash Reconciliation |
| Position issue | Position Reconciliation |
| Corporate action issue | Corporate Actions, Dividend Accruals, Coupon Accruals |
| GL issue | General Ledger |
| Trial balance issue | Trial Balance |
| NAV issue | NAV Package |
| Investor issue | Investor Capital Activity or Subscriptions & Redemptions |
| Fee issue | Management Fee Engine or Performance Fee Engine |

### Step 7: Navigate to the Source Module

Use the left sidebar to open the relevant tab.

Example:

If the scenario is “Stale Price,” open **Pricing Engine**.

If the scenario is “Custodian Quantity Mismatch,” open **Position Reconciliation**.

If the scenario is “Subscription Capital Error,” open **Investor Capital Activity**.

### Step 8: Review the Data

Do not edit immediately.

First review:

- Which row looks unusual?
- Which field is causing the issue?
- Is the amount material?
- Is the issue timing-related or economic?
- Is there a break already open?
- Is NAV release blocked?

### Step 9: Use AI Copilot for Guidance

Open **AI Copilot**.

Ask:

- What should I investigate first?
- Which module caused this scenario?
- What is the NAV impact?
- Is this issue timing or economic?
- Which controls failed?
- Would NAV release be blocked?

The AI Copilot should guide your investigation instead of simply giving a final answer.

### Step 10: Make Manual Intervention

If the scenario requires correction, edit the relevant field.

Common editable fields:

- Market price
- FX rate
- Quantity
- Trade price
- Trade fee
- Cash balance
- Position quantity
- Investor capital
- Investor shares
- High water mark
- Management fee %
- Performance fee %
- Derivative MTM
- Collateral

After editing:

1. Press Enter, or
2. Click outside the field.

The dashboard should recalculate immediately.

### Step 11: Submit Manual Updates

Click **Submit Manual Updates**.

Purpose:

- Locks in the manual change for review
- Creates before/after impact tracking
- Updates the impact report
- Adds an audit trail entry
- Shows downstream dependency impact

### Step 12: Review Impact Summary

Check the right-side Impact Summary panel.

Review:

- NAV Impact
- NAV Impact %
- P&L Impact
- GL Impact
- Cash Impact
- Investor Impact
- Risk Severity
- Materiality Status
- Approval Status

Key question:

Did the issue create a material NAV movement?

### Step 13: Review Dependency Flow

Check the dependency strip or bottom panel.

The expected flow is:

Trade Blotter -> Portfolio Holdings -> Cash Reconciliation -> Position Reconciliation -> General Ledger -> Trial Balance -> P&L -> Balance Sheet -> NAV Package -> Investor Reporting.

Purpose:

Understand how the issue moved across the NAV lifecycle.

### Step 14: Review Reconciliation Breaks

Open **Reconciliation Breaks**.

Review:

- Break type
- Severity
- Aging
- Owner
- NAV impact
- Root cause
- Status
- Resolution notes

Ask:

- Is this break still open?
- Is this break NAV impacting?
- Should this be escalated?
- Can NAV be released with this break?

### Step 15: Review General Ledger

Open **General Ledger**.

Review:

- Source module
- Journal entry
- Debit
- Credit
- Memo
- Audit reference

Ask:

- Was an accounting entry generated?
- Is debit/credit logic correct?
- Did the entry flow from the right module?

### Step 16: Review Trial Balance

Open **Trial Balance**.

Check whether it is:

- Balanced
- Out of balance

If out of balance:

- Review GL entries
- Review manual adjustments
- Review unresolved exceptions

### Step 17: Review P&L Statement

Open **P&L Statement**.

Review:

- Realized gain/loss
- Unrealized gain/loss
- FX gain/loss
- Dividend income
- Interest income
- Management fee
- Performance fee
- Broker fee

Ask:

- Which P&L line moved?
- Was the movement expected?
- Is the P&L impact material?

### Step 18: Review Balance Sheet

Open **Balance Sheet**.

Confirm:

Assets = Liabilities + Capital.

If not:

- Review GL
- Review valuation
- Review investor capital
- Review cash movements

### Step 19: Review NAV Package

Open **NAV Package**.

Review:

- Gross assets
- Liabilities
- Net assets
- Investor capital
- Shares outstanding
- NAV/share
- Fee accruals
- NAV waterfall

Ask:

- Did NAV move as expected?
- Did NAV/share move?
- Which part of the waterfall changed?
- Are open breaks blocking NAV release?

### Step 20: Review Audit Trail

Open **Audit Trail**.

Review:

- Timestamp
- Changed field
- Old value
- New value
- Impacted modules
- User action

Purpose:

Confirm that the scenario investigation and manual update were properly tracked.

### Step 21: Download Evidence

Use download buttons where available.

Recommended downloads:

- Download Current Data
- Download Impact Report
- Download NAV Summary
- Download Inputs

Purpose:

Create a training evidence pack showing what changed and why.

### Step 22: Reset Scenario

After finishing:

Click **Reset book**.

Purpose:

- Restores original sample values
- Clears active scenario effects
- Prepares for the next practice case

---

## 6. How to Investigate by Scenario Type

## 6.1 Pricing Scenario

Examples:

- Stale price
- Missing vendor price
- Manual override
- Price tolerance breach

Investigation path:

1. Scenario Simulation
2. Pricing Engine
3. Portfolio Holdings
4. Reconciliation Breaks
5. General Ledger
6. P&L Statement
7. NAV Package
8. Audit Trail

What to check:

- Current price
- Prior price
- Price source
- Price movement %
- Stale flag
- Valuation hierarchy
- NAV impact

Expected impact:

- Market value changes
- Unrealized P&L changes
- NAV changes
- Pricing exception may be created
- NAV release may be blocked if material

AI Copilot questions:

- Why did NAV move after the price change?
- Is this a stale price issue?
- What is the pricing control breach?
- Would this require valuation committee review?

---

## 6.2 FX Scenario

Examples:

- FX shock
- Wrong FX source
- Prior-day FX error
- Missing FX rate

Investigation path:

1. Scenario Simulation
2. FX Rates
3. Portfolio Holdings
4. P&L Statement
5. NAV Package
6. Investor Reporting
7. Audit Trail

What to check:

- Currency pair
- Current FX rate
- Prior FX rate
- Holdings in local currency
- Base currency translated value

Expected impact:

- FX P&L changes
- Market value in base currency changes
- NAV changes
- Exposure changes
- Investor allocations may change

AI Copilot questions:

- Explain FX impact.
- Which holdings are affected by this FX rate?
- Was the NAV drop caused by FX?
- What is realized vs unrealized FX impact?

---

## 6.3 Trade Scenario

Examples:

- Duplicate trade
- Wrong buy/sell flag
- Failed settlement
- Wrong broker fee
- Trade booked after cutoff

Investigation path:

1. Scenario Simulation
2. Trade Blotter
3. Portfolio Holdings
4. Cash Reconciliation
5. Position Reconciliation
6. General Ledger
7. NAV Package
8. Audit Trail

What to check:

- Trade date
- Settle date
- Side
- Quantity
- Price
- Fees
- Status
- Broker

Expected impact:

- Position changes
- Cash changes
- Broker fee changes
- GL posting changes
- Settlement break may appear

AI Copilot questions:

- Explain trade lifecycle.
- What GL entries were generated?
- Why is this trade unsettled?
- Which downstream modules update after this trade?

---

## 6.4 Cash Reconciliation Scenario

Examples:

- Missing dividend receipt
- Subscription cash not allocated
- Redemption paid but unbooked
- Financing charge missing
- Custodian balance mismatch

Investigation path:

1. Scenario Simulation
2. Cash Reconciliation
3. Reconciliation Breaks
4. General Ledger
5. Balance Sheet
6. NAV Package
7. Audit Trail

What to check:

- Internal ledger cash
- Custodian cash
- Prime broker cash
- Difference
- Break reason
- Owner
- Status

Expected impact:

- Cash difference appears
- Break generated
- NAV release may be blocked if material
- Balance sheet cash may require adjustment

AI Copilot questions:

- Is this cash break timing or real?
- Which side is incorrect?
- What is the NAV impact?
- Should this be escalated?

---

## 6.5 Position Reconciliation Scenario

Examples:

- Custodian quantity mismatch
- Pending settlement timing break
- Corporate action not processed
- Security missing from PB file

Investigation path:

1. Scenario Simulation
2. Position Reconciliation
3. Portfolio Holdings
4. Reconciliation Breaks
5. General Ledger
6. NAV Package
7. Audit Trail

What to check:

- Internal position
- Custodian position
- Prime broker position
- Difference
- Settlement status
- Break reason

Expected impact:

- Position break created
- Holdings may not agree to external books
- NAV may be blocked if position is material

AI Copilot questions:

- Why is position mismatching?
- Is this pending settlement?
- Which side is incorrect?
- What controls should be performed?

---

## 6.6 Corporate Action Scenario

Examples:

- Dividend accrual missing
- Wrong withholding tax
- Stock split not processed
- Coupon accrual mismatch

Investigation path:

1. Scenario Simulation
2. Corporate Actions
3. Dividend Accruals or Coupon Accruals
4. Portfolio Holdings
5. General Ledger
6. P&L Statement
7. NAV Package
8. Audit Trail

What to check:

- Event type
- Ex-date
- Record date
- Pay date
- Eligible quantity
- Gross amount
- Withholding tax
- Net receivable
- Posting status

Expected impact:

- Income accrual changes
- Receivable changes
- P&L income changes
- Cash settlement may follow later
- GL accrual posting generated

AI Copilot questions:

- Explain dividend accrual process.
- What is withholding tax treatment?
- Why is ex-date important?
- What GL entry is created?

---

## 6.7 General Ledger Scenario

Examples:

- Journal out of balance
- FX revaluation missing
- Fee accrual incorrect
- Manual adjustment pending approval

Investigation path:

1. Scenario Simulation
2. General Ledger
3. Trial Balance
4. P&L Statement
5. Balance Sheet
6. NAV Package
7. Audit Trail

What to check:

- Debit
- Credit
- Source module
- Account
- Memo
- Audit reference

Expected impact:

- Trial balance may go out of balance
- P&L or balance sheet may change
- NAV may be blocked until corrected

AI Copilot questions:

- Explain this journal.
- What is debit/credit logic?
- Which module generated this entry?
- Why is trial balance impacted?

---

## 6.8 Investor Capital Scenario

Examples:

- Late subscription
- Incorrect share issuance
- Equalization mismatch
- Redemption not booked
- Side-pocket allocation issue

Investigation path:

1. Scenario Simulation
2. Investor Capital Activity
3. Subscriptions & Redemptions
4. Management Fee Engine
5. Performance Fee Engine
6. NAV Package
7. Investor Reporting
8. Audit Trail

What to check:

- Investor capital
- Shares
- Share class
- High water mark
- Equalization credit
- Allocation %

Expected impact:

- Investor capital changes
- NAV/share may change
- Fee allocation changes
- Investor statement changes
- Audit trail captures update

AI Copilot questions:

- Why did NAV/share change?
- What is investor allocation impact?
- Explain equalization.
- How does capital affect fee calculation?

---

## 7. Scenario Review Questions

At the end of every scenario, answer these questions:

1. What was the source module?
2. What field changed?
3. Was the issue pricing, FX, cash, position, trade, GL, investor, or corporate action related?
4. Was the issue timing or economic?
5. What was the NAV impact?
6. What was the P&L impact?
7. What was the GL impact?
8. Did a reconciliation break appear?
9. Did materiality become Medium or Critical?
10. Would NAV release be blocked?
11. Which approval is required?
12. What audit evidence was created?
13. What is the correct operational resolution?

---

## 8. Pass or Fail Criteria

A scenario is considered successful if the user can:

- Identify the correct source module
- Locate the affected record
- Explain why the issue occurred
- Determine whether it is timing or economic
- Determine NAV impact
- Review downstream tabs
- Submit manual update if required
- Review audit trail
- Explain the control failure
- State whether NAV release should be blocked

A scenario is incomplete if the user:

- Edits numbers without investigation
- Does not review downstream impact
- Does not check NAV Package
- Does not check Reconciliation Breaks
- Does not submit manual updates
- Does not review audit trail
- Cannot explain the accounting impact

---

## 9. Evidence Pack Requirements

For proper training documentation, collect:

- Screenshot or export of source tab before update
- Download Current Data
- Download Impact Report
- NAV Summary
- Upload input register if files were used
- Audit Trail
- Notes explaining root cause
- AI Copilot explanation if used

Recommended evidence pack order:

1. Scenario description
2. Source module data
3. Manual update evidence
4. Before/after impact report
5. Reconciliation break evidence
6. GL evidence
7. NAV Package evidence
8. Audit trail
9. Resolution explanation

---

## 10. Best Practice for Students

Students should focus on understanding:

- What changed
- Why it changed
- Where it changed
- Which modules were affected
- How NAV moved
- What the accounting entry means
- Whether the issue is material

Do not rush to fix the issue. The goal is to understand the full NAV lifecycle.

---

## 11. Best Practice for Working Professionals

Working professionals should use scenarios to practice:

- Root cause analysis
- Materiality assessment
- NAV release decisioning
- Maker-checker review
- Break ownership
- Audit evidence collection
- Operational escalation
- Client-ready explanation

Focus on whether the issue would block NAV release in a real fund administration environment.

---

## 12. Common Mistakes

### Mistake 1: Starting Without Reset

Always reset before a new scenario to avoid mixed impacts.

### Mistake 2: Editing Too Quickly

Investigate before changing numbers.

### Mistake 3: Ignoring Reconciliation Breaks

Most scenarios should be reviewed through the break dashboard.

### Mistake 4: Not Reviewing GL

Every meaningful financial change should be understood from an accounting perspective.

### Mistake 5: Not Checking NAV Package

The final question is always whether NAV is correct and releasable.

### Mistake 6: Forgetting Submit Manual Updates

Submit is required to capture formal before/after impact.

### Mistake 7: Treating AI Copilot as Final Answer

AI should guide investigation, not replace user analysis.

---

## 13. Scenario Completion Checklist

Before closing a scenario, confirm:

- Scenario read fully
- Source module identified
- Affected row reviewed
- Manual edit completed if required
- Submit Manual Updates clicked
- Impact Summary reviewed
- Reconciliation Breaks reviewed
- GL reviewed
- Trial Balance reviewed
- P&L reviewed
- Balance Sheet reviewed
- NAV Package reviewed
- Investor impact reviewed if applicable
- Audit Trail reviewed
- AI Copilot explanation reviewed
- Evidence exported if needed
- Reset book completed

---

## 14. Recommended Practice Sequence

For beginners:

1. Pricing scenario
2. FX scenario
3. Cash reconciliation scenario
4. Position reconciliation scenario
5. Investor capital scenario

For intermediate users:

1. Trade settlement scenario
2. Corporate action scenario
3. Fee accrual scenario
4. GL imbalance scenario
5. NAV package scenario

For advanced users:

1. Multi-factor stress scenario
2. Market crash scenario
3. Counterparty exposure scenario
4. Redemption pressure scenario
5. Material break blocking NAV release scenario

---

## 15. Final Learning Principle

Scenario Simulation is not only about changing numbers.

It is about understanding operational cause and effect:

Source issue -> Accounting treatment -> Reconciliation break -> Control failure -> NAV impact -> Investor impact -> Approval decision.

That is the core workflow of institutional hedge fund NAV operations.


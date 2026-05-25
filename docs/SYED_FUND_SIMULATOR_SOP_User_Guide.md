# SYED FUND SIMULATOR

## Standard Operating Procedure and User Navigation Guide

### Document Purpose

This SOP explains how to use the SYED FUND SIMULATOR as an institutional hedge fund accounting, reconciliation, NAV operations, and fund administration training platform.

The simulator is designed to help users understand how a single operational change flows through the complete NAV lifecycle:

Trade Booking -> Holdings -> Pricing -> FX -> Reconciliations -> General Ledger -> Trial Balance -> P&L -> Balance Sheet -> NAV Package -> Investor Reporting -> Audit Trail.

---

## 1. Accessing the Application

### Live Web Version

Open:

https://syed-fund-simulator.vercel.app

Only approved users should access the platform if access control is enabled.

### Local Version

Use the local version when testing new changes before deployment.

From the project folder, run:

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm run dev
```

Then open:

http://127.0.0.1:5173

---

## 2. Main Screen Layout

### Left Sidebar

The left sidebar is the main module navigator. Use it to move between operational areas such as:

- Executive Dashboard
- Portfolio Holdings
- Trade Blotter
- Pricing Engine
- FX Rates
- Cash Reconciliation
- Position Reconciliation
- Reconciliation Breaks
- General Ledger
- Trial Balance
- P&L Statement
- Balance Sheet
- NAV Package
- Investor Capital Activity
- Scenario Simulation
- Audit Trail
- Exception Management
- AI Copilot

### Top Header

The top header shows live operational indicators:

- Fund selector
- NAV
- NAV per share
- Open break count
- Materiality status
- Last updated time
- Sandbox / Live Mode toggle
- AI Copilot button
- Reset book button

### Main Center Area

The center area displays the active module. This is where users review tables, edit values, upload files, analyze breaks, or review NAV output.

### Right Panel

The right panel shows:

- Impact Summary
- Suggested Operational Questions
- AI Copilot chat
- Controls triggered
- Approval status
- NAV release status

---

## 3. Recommended Operating Modes

### Sandbox Mode

Use Sandbox Mode for training, practice, scenario testing, and manual experimentation.

Recommended for:

- Students
- New fund accounting analysts
- Interview preparation
- Testing scenarios
- Understanding NAV impact

In Sandbox Mode, users can safely edit numbers and observe how the simulator recalculates NAV, P&L, GL, cash, investor allocation, and breaks.

### Live Mode

Use Live Mode to view the platform as a production-style NAV operations dashboard.

Recommended for:

- Clean operational review
- Presentation
- Demonstration
- Reviewing the current state of the book

Avoid using Live Mode for heavy experimentation.

---

## 4. Standard Daily Navigation Flow

Use this sequence to simulate a real hedge fund administration NAV day.

### Step 1: Executive Dashboard

Start on the Executive Dashboard.

Review:

- Gross assets
- Liabilities
- Net assets
- Unrealized P&L
- Open exceptions
- NAV waterfall
- Strategy exposure

Purpose:

Understand the overall fund status before reviewing detailed modules.

### Step 2: Fund Master Setup

Review fund configuration.

Check:

- Fund name
- Base currency
- NAV frequency
- Prime broker
- Custodian
- Administrator
- Management fee %
- Performance fee %
- Hurdle rate
- High water mark setting

Purpose:

Confirm that the fund setup is correct before NAV production.

### Step 3: Portfolio Holdings

Open Portfolio Holdings.

Review:

- Ticker
- Asset type
- Quantity
- Cost price
- Market price
- FX rate
- Market value
- Price P&L
- FX P&L
- Total unrealized P&L
- Exposure %

Editable fields:

- Quantity
- Cost price
- Market price

After editing, click:

Submit Manual Updates

Expected downstream impact:

- Holdings valuation changes
- Unrealized P&L changes
- NAV changes
- Exposure changes
- GL updates
- Trial balance updates
- P&L updates
- Balance sheet updates
- Investor allocation updates

### Step 4: Pricing Engine

Open Pricing Engine.

Review:

- Current price
- Prior price
- Price movement %
- Price source
- Stale price alerts
- Pricing exceptions

Editable fields:

- Current market price

Common scenario:

Change one security price and submit updates. Then review NAV impact.

### Step 5: FX Rates

Open FX Rates.

Review:

- Currency pair
- Current FX rate
- Prior FX rate
- Source

Editable fields:

- FX rate

Expected downstream impact:

- Local-to-base market value changes
- FX P&L changes
- NAV changes
- Investor allocation changes
- Exposure changes

### Step 6: Trade Blotter

Open Trade Blotter.

Review:

- Trade date
- Settle date
- Broker
- Buy/Sell flag
- Ticker
- Quantity
- Price
- Fees
- Net amount
- Status
- Trade ID

Editable fields:

- Quantity
- Price
- Fees

Expected downstream impact:

- Trade net amount changes
- Broker fees change
- GL postings update
- Cash and position reconciliation may generate breaks

### Step 7: Cash Reconciliation

Open Cash Reconciliation.

Review:

- Currency
- Internal ledger cash
- Custodian cash
- Prime broker cash
- Difference
- Break reason
- Owner
- Status

Editable fields:

- Internal ledger cash
- Custodian cash
- Prime broker cash
- Break reason
- Owner

Purpose:

Identify cash breaks between internal books, custodian statements, and prime broker records.

### Step 8: Position Reconciliation

Open Position Reconciliation.

Review:

- Ticker
- Internal position
- Custodian position
- Prime broker position
- Difference
- Settlement status
- Break reason
- Owner
- Status

Editable fields:

- Internal position
- Custodian position
- Prime broker position
- Break reason
- Owner

Purpose:

Identify position breaks caused by failed trades, pending settlement, corporate actions, or stale positions.

### Step 9: Reconciliation Breaks

Open Reconciliation Breaks.

Review:

- Break ID
- Break type
- Severity
- Aging
- Owner
- NAV impact
- Root cause
- Status
- Escalation level

Typical break statuses:

- Open
- Investigating
- Pending External Party
- Escalated
- Resolved
- Approved
- Closed

Purpose:

Centralize operational breaks and determine whether NAV release should be blocked.

### Step 10: Corporate Actions

Open Corporate Actions.

Review:

- Event type
- Security
- Ex-date
- Record date
- Pay date
- Eligible quantity
- Gross amount
- Withholding tax
- Net receivable
- Status
- Posting status

Purpose:

Understand how dividends, coupons, stock splits, rights issues, mergers, and spin-offs affect NAV and accounting.

### Step 11: General Ledger

Open General Ledger.

Review:

- Journal entry ID
- Date
- Source module
- Memo
- Account
- Debit
- Credit
- Audit reference

Purpose:

Understand the double-entry accounting created by trades, accruals, fees, subscriptions, redemptions, FX and MTM adjustments.

### Step 12: Trial Balance

Open Trial Balance.

Review:

- Debit
- Credit
- Balance
- Account category

Control:

The trial balance should show BALANCED.

If it is out of balance, review GL entries and exceptions.

### Step 13: P&L Statement

Open P&L Statement.

Review:

- Dividend income
- Interest income
- Realized gain/loss
- Unrealized gain/loss
- FX gain/loss
- Management fee
- Performance fee
- Broker fee
- Financing cost
- Admin fee
- Net profit/loss

Purpose:

Understand how investment activity and operating expenses drive fund performance.

### Step 14: Balance Sheet

Open Balance Sheet.

Review:

- Assets
- Liabilities
- Capital

Control:

Assets must equal Liabilities plus Capital.

### Step 15: NAV Package

Open NAV Package.

Review:

- Gross assets
- Liabilities
- Net assets
- Investor capital
- Shares outstanding
- NAV per share
- Management fee accrual
- Performance fee accrual
- NAV waterfall

Use the NAV Pack Input Center to upload:

- Pricing file
- FX rate sheet
- Security master
- Trade blotter
- Cash statement
- Position file
- Corporate actions
- Investor capital file

Download options:

- Download Inputs
- Download NAV Summary
- Download Impact

Purpose:

Consolidate all operational evidence needed for NAV review and approval.

### Step 16: Investor Capital Activity

Open Investor Capital Activity.

Review:

- Investor name
- Share class
- Capital
- Shares
- High water mark
- Equalization
- Allocation %

Editable fields:

- Capital
- Shares
- High water mark

After editing, click:

Submit Manual Updates

Expected downstream impact:

- Investor capital changes
- NAV/share changes
- Fee allocation changes
- Investor reporting changes
- Equalization may change

### Step 17: Audit Trail

Open Audit Trail.

Review:

- Timestamp
- Changed field
- Old value
- New value
- Action
- Impacted modules

Purpose:

Confirm that every manual edit, upload, scenario, approval, and AI-assisted action is traceable.

---

## 5. How to Use Scenario Simulation

### Purpose

Scenario Simulation allows users to practice realistic operational incidents and observe their impact across the NAV lifecycle.

### Standard Scenario Workflow

1. Switch to Sandbox Mode.
2. Open Scenario Simulation.
3. Review the active scenario.
4. Read the objective and business context.
5. Click Start Investigation.
6. Navigate to the impacted source module.
7. Review the affected data.
8. Edit the value if required.
9. Click Submit Manual Updates.
10. Review the Impact Summary.
11. Check Reconciliation Breaks.
12. Check General Ledger.
13. Check Trial Balance.
14. Check P&L Statement.
15. Check NAV Package.
16. Ask AI Copilot to explain the impact.
17. Reset book when finished.

### Example Scenario: Stale Price

Scenario:

A stale vendor price is loaded for a listed equity.

User investigation:

- Open Pricing Engine
- Identify stale price
- Compare prior price and current price
- Update price if needed
- Submit manual updates

Expected impact:

- Market value changes
- Unrealized P&L changes
- NAV changes
- Pricing exception appears
- NAV release may be blocked if material

### Example Scenario: Investor Capital Error

Scenario:

A subscription amount is booked incorrectly.

User investigation:

- Open Investor Capital Activity
- Locate investor
- Change capital
- Submit manual updates
- Review NAV/share

Expected impact:

- Investor capital changes
- Shares outstanding may change
- NAV/share changes
- Fee allocation changes
- Investor reporting changes

---

## 6. How to Use Manual Data Edit Mode

### Purpose

Manual Data Edit Mode allows users to directly amend operational data and observe the full NAV impact.

### Standard Manual Edit Workflow

1. Open the required module.
2. Locate the editable field.
3. Change the number.
4. Press Enter or click outside the field.
5. Review immediate recalculation.
6. Click Submit Manual Updates.
7. Review Impact Summary.
8. Review downstream tabs.
9. Download Impact Report if needed.

### Editable Areas

Users can edit:

- Market prices
- FX rates
- Quantities
- Trade prices
- Trade fees
- Cash balances
- Position reconciliation balances
- Investor capital
- Investor shares
- High water marks
- Fee percentages
- Derivative MTM
- Collateral

### Important

Changing a value updates the simulator state. Clicking Submit Manual Updates records the formal before/after impact for review and export.

---

## 7. How to Use File Uploads

### Supported Formats

- CSV
- XLSX
- JSON

### Upload Workflow

1. Open the relevant module.
2. Select the file source type.
3. Click Upload File.
4. Choose local file.
5. Review upload history.
6. Review validation result.
7. Resolve generated breaks if any.

### Upload Validation Checks

The simulator can flag:

- Missing data
- Unsupported file type
- Duplicate records
- Stale pricing
- Unmatched cash
- Rejected rows
- Warning rows

### NAV Pack Uploads

For NAV Package review, use the NAV Pack Input Center to load all supporting files in one place.

---

## 8. How to Use AI Copilot

### Purpose

AI Copilot is an embedded institutional operations assistant.

Use it to understand:

- NAV movements
- Accounting impact
- Reconciliation breaks
- Pricing issues
- FX movements
- GL postings
- Approval controls
- Operational best practices

### How to Ask Questions

Open AI Copilot and type questions such as:

- Why did NAV move?
- What is the accounting impact?
- Which module caused this change?
- Is this break NAV impacting?
- What should I review before NAV publish?
- Which controls failed?
- Why is this journal posted?
- What is the investor impact?

### Suggested Questions

The right panel displays suggested operational questions based on the active tab.

Use:

- Show more
- Rotate questions
- Category filters

### Recommended Usage

Do not use AI Copilot only for answers. Use it as a guide to investigate the issue yourself.

---

## 9. Download and Evidence Pack Workflow

### Download Current Data

Use this to export the current table view for a module.

### Download Impact Report

Use this after submitting manual updates to export before/after movement.

### Download NAV Summary

Use this inside NAV Package to export key NAV figures.

### Download Inputs

Use this inside NAV Package to export the uploaded file register.

### Recommended Review Pack

For a complete NAV review, download:

- Current data from impacted tab
- Impact report
- NAV summary
- NAV input register
- Audit trail

---

## 10. Reset Workflow

Use Reset book when you want to return to the original sample data.

Reset book should be used:

- After completing a scenario
- After manual testing
- Before starting a new practice session
- Before presenting the clean dashboard

Important:

Reset restores prior sample figures and clears the active ripple impact.

---

## 11. Recommended Training Exercises

### Exercise 1: Price Impact

1. Open Portfolio Holdings.
2. Change market price for a holding.
3. Submit manual updates.
4. Review NAV, P&L, GL, Trial Balance, NAV Package.
5. Ask AI Copilot: Why did NAV move?

### Exercise 2: FX Impact

1. Open FX Rates.
2. Change EUR/USD or GBP/USD.
3. Submit manual updates.
4. Review holdings, FX P&L, NAV and investor allocation.

### Exercise 3: Cash Break

1. Open Cash Reconciliation.
2. Change custodian cash.
3. Submit manual updates.
4. Review Reconciliation Breaks and NAV release status.

### Exercise 4: Position Break

1. Open Position Reconciliation.
2. Change custodian position.
3. Submit manual updates.
4. Review break severity and NAV impact.

### Exercise 5: Investor Capital

1. Open Investor Capital Activity.
2. Change investor capital.
3. Submit manual updates.
4. Review NAV/share, investor allocation and fee impact.

### Exercise 6: NAV Pack Review

1. Open NAV Package.
2. Upload source files in NAV Pack Input Center.
3. Review upload validation.
4. Download NAV Summary and Impact Report.

---

## 12. Common User Mistakes

### Mistake 1: Editing but not submitting

If you edit a value but do not click Submit Manual Updates, the screen may recalculate, but the formal before/after impact report may not be captured.

### Mistake 2: Reviewing only one tab

Operational changes affect multiple tabs. Always check downstream modules.

### Mistake 3: Ignoring materiality

If materiality is Medium or Critical, NAV release may be blocked.

### Mistake 4: Forgetting Reset book

Always reset before starting a fresh training case.

### Mistake 5: Treating AI Copilot as a replacement for investigation

Use AI Copilot to guide your analysis, not to skip operational review.

---

## 13. Institutional Review Checklist

Before considering NAV ready:

- Fund setup reviewed
- Prices reviewed
- FX rates reviewed
- Trades reviewed
- Cash reconciliation reviewed
- Position reconciliation reviewed
- Corporate actions reviewed
- GL generated
- Trial balance balanced
- P&L reviewed
- Balance sheet validated
- Investor capital reviewed
- Open breaks assessed
- Material breaks cleared or approved
- NAV Package reviewed
- Audit trail reviewed
- Approval workflow completed

---

## 14. Glossary

### NAV

Net Asset Value. Fund assets minus liabilities.

### NAV/share

NAV divided by shares outstanding.

### GL

General Ledger. The accounting book of journal entries.

### Trial Balance

Summary of account debits and credits. It should balance.

### Reconciliation Break

A mismatch between internal records and external records such as custodian or prime broker data.

### Materiality

Threshold used to decide whether a break or movement is significant enough to block NAV release.

### HWM

High Water Mark. Used in performance fee calculations.

### Equalization

Investor-level adjustment used to ensure fair performance fee allocation.

### Maker-Checker

Institutional control where one person prepares and another reviews or approves.

---

## 15. Best Practice Navigation Pattern

For every issue, follow this investigation pattern:

1. Identify source module.
2. Review changed value.
3. Submit manual update.
4. Review Impact Summary.
5. Review Reconciliation Breaks.
6. Review GL.
7. Review Trial Balance.
8. Review P&L.
9. Review Balance Sheet.
10. Review NAV Package.
11. Review Investor Reporting.
12. Review Audit Trail.
13. Ask AI Copilot for explanation.
14. Reset book when complete.

This is the core learning principle of the simulator:

One operational issue can affect the entire NAV lifecycle.


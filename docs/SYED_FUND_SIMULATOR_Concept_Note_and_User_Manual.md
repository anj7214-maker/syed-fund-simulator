# SYED FUND SIMULATOR

## Concept Note and User Manual

SYED FUND SIMULATOR is an institutional hedge fund accounting and NAV operations training environment. It helps users understand how real fund administrators move from trade booking, holdings, pricing, FX, accruals and reconciliations through GL, trial balance, P&L, balance sheet, NAV package, investor allocation and reporting.

The platform is not a static dashboard. It is a connected operating book where manual edits, scenario changes, uploads and workflow actions create visible downstream accounting and NAV impact.

## 1. Concept Note

### Purpose

The simulator is designed as a hands-on NAV operations practice lab for:

- Fund accounting training
- NAV operations training
- Reconciliation investigation
- Pricing and FX validation
- Investor capital activity review
- Operational risk and exception management
- Interview preparation for fund administration and investment operations roles

### Target Users

The platform is suitable for students, freshers, fund accounting trainees, operations analysts, NAV oversight users, interview candidates and working professionals moving into hedge fund operations.

### Operating Model

The simulator uses centralized live state, institutional sample data, reconciliation breaks, manual edit controls, NAV impact analysis, approval workflow and audit trail tracking.

### Core Modules

The dashboard includes portfolio holdings, trade blotter, pricing, FX, cash reconciliation, position reconciliation, break management, corporate actions, dividend and coupon accruals, OTC derivatives, general ledger, trial balance, P&L, balance sheet, NAV package and investor activity.

### Training Value

Users can amend prices, FX rates, quantities, cash, positions, investor capital, fees and derivative MTM values, then observe NAV, P&L, GL, break, risk and investor impacts.

### What The Simulator Teaches

- How one operational issue flows through the NAV lifecycle.
- Why pricing, FX, cash, position, corporate action and GL controls matter before NAV release.
- How maker-checker review, materiality thresholds and audit evidence support institutional NAV governance.
- How reconciliation breaks are investigated, assigned, escalated, resolved and approved.

### Positioning

Use the simulator as a practice lab for NAV operations, not as a production accounting system. The data is mock institutional data built for training and interview preparation.

## 2. User Manual

Use the dashboard like an operations workstation. Start with the header metrics, move through the relevant module, amend or upload data, submit the update, and review the impact summary, dependency flow, audit trail and AI Copilot explanation.

### Access and Running

Local run:

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

Live app:

```text
https://syed-fund-simulator.vercel.app
```

### Main Controls

- **Reset book:** Restores the expanded practice dataset and creates a before/after baseline for impact checking.
- **Sandbox / Live Mode:** Sandbox is for practice and manual intervention; Live Mode is for operational review.
- **Submit Manual Updates:** Records manual changes, refreshes NAV impact and writes audit evidence.
- **AI Copilot:** Explains NAV movements, breaks, GL, pricing, FX, uploads, approvals and workflow dependencies.

### Editable Practice Areas

- Portfolio Holdings: quantity, cost price and market price.
- Pricing Engine: current market price.
- FX Rates: valuation rates by currency pair.
- Trade Blotter: quantity, price and broker fees.
- Investor Capital Activity: capital, shares and high water mark.
- Fee Engine: management fee and performance fee percentages.
- OTC Derivatives: MTM, accrued interest and collateral.
- Cash Reconciliation: internal ledger cash, custodian cash, prime broker cash, break reason and owner.
- Position Reconciliation: internal position, custodian position, PB position, break reason and owner.

### Recommended Practice Workflow

1. Click **Reset book** to load the latest baseline data.
2. Choose a tab such as Position Reconciliation, Pricing Engine or Investor Capital Activity.
3. Change one or two editable values.
4. Click **Submit Manual Updates**.
5. Review NAV impact, P&L impact, GL impact, risk severity and approval status.
6. Use AI Copilot to explain what moved, what controls failed and whether NAV release is blocked.
7. Resolve or approve breaks in Reconciliation Breaks and check audit trail evidence.

### Important Control Note

If the app still shows old rows after deployment, hard refresh the browser and click **Reset book**. The reset action reloads the expanded practice baseline into local persistence.

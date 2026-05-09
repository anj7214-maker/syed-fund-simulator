# SYED FUND SIMULATOR

Production-grade institutional hedge fund accounting and NAV operations simulation platform.

## What is included

- React 19, TypeScript, Tailwind CSS, Zustand, TanStack Table, Framer Motion, Recharts, React Query, IndexedDB persistence
- Centralized institutional sample data for holdings, trades, FX, investors, capital activity, accruals, OTC derivatives and exceptions
- Real-time recalculation engine for holdings, pricing, FX, GL, trial balance, P&L, balance sheet, fee accruals, NAV and investor allocation
- Bloomberg-style dark operations workstation with 35 sidebar modules
- Editable grids with flashing dependency updates and audit trail
- Scenario simulations: Market Crash, FX Shock, Redemption Run, Rate Hike, Counterparty Default
- Export actions for NAV pack, investor statement, TB, P&L and balance sheet CSV files

## Run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Production build

```bash
npm run build
```

## Deployment And Access

Public app link:

https://syed-fund-simulator.vercel.app

Approved-user access is managed in Vercel with:

```text
VITE_APPROVED_EMAILS
```

See `PROJECT_NOTES.md` for deployment, GitHub, and access-control notes.

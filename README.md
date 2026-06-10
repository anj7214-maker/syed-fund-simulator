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

## Enterprise backend foundation

This repository now includes the first institutional backend foundation:

- `server/index.mjs` - local API for health, tenant bootstrap, maker-checker approvals, immutable audit events, and Copilot orchestration stub
- `db/schema.sql` - PostgreSQL tenant/fund/break/workflow/audit/ingestion schema with row-level security and hash-chained audit trail
- `docker-compose.yml` - local API + PostgreSQL stack
- `infra/aws` - customer VPC Terraform starter

Run the backend API locally:

```bash
npm run api
```

Run API + PostgreSQL locally:

```bash
docker compose up --build
```

See `docs/ENTERPRISE_SAAS_FOUNDATION.md` for the implementation notes and next milestone.

## Deployment And Access

Public app link:

https://syed-fund-simulator.vercel.app

Approved-user access is managed in Vercel with:

```text
VITE_APPROVED_EMAILS
```

See `PROJECT_NOTES.md` for deployment, GitHub, and access-control notes.

## Corporate Code Sharing

For corporate or technical review, share this repository with **read-only GitHub access** only.

Do not share `.env`, `.env.local`, Vercel admin access, Clerk admin access, tokens, passwords, or private credentials.

See:

- `CODE_SHARING_GUIDE.md`
- `CONFIDENTIALITY_NOTICE.md`
- `SECURITY_SHARING_CHECKLIST.md`

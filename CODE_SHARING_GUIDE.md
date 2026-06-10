# SYED FUND SIMULATOR - Code Sharing Guide

This repository contains the SYED FUND SIMULATOR application source code. Use this guide when sharing the project with reviewers, corporate stakeholders, technical evaluators, or implementation partners.

## Recommended Sharing Method

Share the GitHub repository using **read-only access**.

Do not provide:

- GitHub password
- GitHub personal access token
- Vercel admin access
- Clerk admin access
- `.env` or `.env.local`
- production secrets
- private client data

## Minimum GitHub Permission

Use **Read** permission only.

Read access allows a reviewer to view or clone the code, but does not allow them to push changes, delete the repository, or change repository settings.

Do not grant:

- Write
- Maintain
- Admin

## Important Limitation

If someone can read code, they can copy it. GitHub cannot technically stop a read-only user from cloning or downloading the repository.

To control misuse, use:

- private repository access
- NDA / confidentiality terms
- limited-time access
- watermark/demo notices in the running application
- removal of access after review

## Files That Must Not Be Shared Separately

The repository is configured to ignore private/local files such as:

- `.env`
- `.env.local`
- `.env.*.local`
- `.data/`
- `.codex/`
- `node_modules/`
- `dist/`
- `BACKUPS/`
- local logs

Before sharing any zipped folder manually, confirm these are not included.

## Safe Local Run Instructions For Reviewers

```cmd
npm install
npm run dev
```

If they need the local API:

```cmd
npm run api
```

They should create their own `.env` from `.env.example` if needed.

## Review Scope

This project is a React/TypeScript hedge fund operations simulator with a local Node.js API simulation layer.

Main areas:

- NAV operations command center
- reconciliation workflows
- portfolio and pricing simulation
- GL, trial balance, P&L, balance sheet, NAV package
- investor capital and fee workflows
- sandbox/live mode separation
- AI Copilot UI
- approval queue and audit controls
- Excel/NAV pack export concepts

## Corporate Review Recommendation

For corporate sharing, provide:

1. Vercel demo link for product review.
2. Private GitHub read-only access for technical review.
3. `README.md`, `CODE_SHARING_GUIDE.md`, and `docs/ENTERPRISE_SAAS_FOUNDATION.md` for architecture review.
4. No secrets or private environment files.


---
name: syed-fund-simulator-ops
description: Operate, maintain, secure, deploy, and enhance the SYED FUND SIMULATOR React/Vite hedge fund accounting and NAV operations platform. Use when Codex is asked about this project, local running, Vercel deployment, GitHub pushes, approved-email access control, AI Copilot improvements, institutional NAV workflows, reconciliation/break management, project notes, or handoff documentation.
---

# SYED Fund Simulator Ops

## Core Context

Treat this repository as the source of truth for SYED FUND SIMULATOR, an institutional hedge fund accounting, reconciliation, NAV operations, investor servicing, and AI training simulator.

Before changing code, read the relevant files in `src/` and preserve existing simulator functionality. Most behavior lives in:

- `src/App.tsx` for UI, tabs, Copilot, upload panels, workflow screens.
- `src/store/fundStore.ts` for Zustand state, persistence, actions, access to uploads/breaks/audit context.
- `src/engine/recalc.ts` for recalculation, NAV, GL, trial balance, P&L, balance sheet, fees, and exposures.
- `src/data/sampleData.ts` for institutional mock data.
- `src/types.ts` for domain models and module IDs.
- `src/styles.css` for Bloomberg-style terminal UI.

For project-specific links, commands, and deployment notes, read `references/project-ops.md`.

## Operating Workflow

Use this sequence for project work:

1. Verify the requested scope: local run, Vercel issue, access control, Copilot, NAV workflow, module redesign, upload/recon, or bug fix.
2. Inspect the relevant source files before editing.
3. Keep changes additive unless the user explicitly asks for replacement.
4. Run `node node_modules\typescript\bin\tsc -b` for type safety.
5. Run `npm.cmd run build` before declaring web deployment readiness.
6. If Git is blocked by `.git/index.lock` permission errors, ask the user to run the commit/push commands manually from the project folder.

## Local Run

Use Command Prompt or PowerShell from the project root:

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm run dev
```

Open `http://127.0.0.1:5173`. Keep the terminal open. If the port changes, use the URL printed by Vite.

If the page is black, check for runtime loops or React crashes first. The previous black-screen issue was caused by recursive rendering of `CopilotChatSurface` inside itself.

## Deployment And Sharing

The shareable public URL is the Vercel URL, not localhost. Use the project reference file for the current URL and repo.

For Vercel deployment issues:

- Confirm the latest Git commit is pushed to `main`.
- Wait for the Vercel deployment to show `Ready`.
- Ensure Vercel environment variables include `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_APPROVED_EMAILS`.
- Use comma-separated approved emails in `VITE_APPROVED_EMAILS`.

## Access Control

The app uses Clerk sign-in plus an approved email allowlist. If a user can sign in but sees pending approval, add their exact email to `VITE_APPROVED_EMAILS` in Vercel and redeploy.

Do not commit `.env`. Use `.env.example` for public placeholders only.

## AI Copilot Work

Keep the Copilot context-aware. It should read:

- active tab,
- selected context when available,
- live recalculation outputs,
- open breaks,
- latest uploads,
- NAV and fee data,
- workflow status,
- audit trail context.

Suggested question work should use the dynamic operational question engine in `src/App.tsx`, not static one-off chips. Preserve Learning and Professional modes.

## Institutional UX Rules

Keep the UI dense, dark, operational, and finance-terminal focused. Prefer compact tables, workflow statuses, audit badges, reconciliation controls, maker-checker actions, K/M/B/T number formatting, and contextual Copilot guidance.

Avoid generic dashboard filler or static unrelated exception tables.

---
name: syed-fund-simulator
description: Use when working on the SYED FUND SIMULATOR institutional hedge fund accounting, NAV operations, reconciliation, scenario simulation, AI Copilot, investor fee, waterfall, fund-structure, Vercel deployment, GitHub push, local run, or user documentation tasks. Applies to enhancements, debugging, build verification, deployment guidance, NAV Pack export changes, and explaining how to use the dashboard.
---

# SYED Fund Simulator

## Project

Use this skill for the existing application:

- Name: `SYED FUND SIMULATOR`
- Workspace: `C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge`
- Local URL: `http://127.0.0.1:5173`
- Live URL: `https://syed-fund-simulator.vercel.app`
- GitHub repo: `https://github.com/anj7214-maker/syed-fund-simulator`
- Stack: React, TypeScript, Vite, Zustand, Tailwind-style CSS, Recharts, Framer Motion, TanStack Table, Clerk, Vercel.

## Operating Principles

- Do not rebuild the app from scratch.
- Preserve existing tabs, workflows, calculations, styling, AI Copilot, access control, and deployment setup.
- Prefer additive enhancements that connect to the existing live Zustand state and recalculation engine.
- Keep the UI institutional, dense, dark, operational, and Bloomberg, Geneva, or State Street-like.
- Avoid gamified clutter unless explicitly requested.
- Use existing route/module IDs where possible. Add new `ModuleId` values only when a true new sidebar tab is needed.
- Keep manual edits connected to NAV, GL, P&L, balance sheet, investor capital, audit trail, breaks, and export outputs.
- Run a production build after meaningful changes.

## Key Files

- `src/App.tsx`: main UI, module routing, grids, export builder, Copilot, scenario and workflow screens.
- `src/store/fundStore.ts`: Zustand state, update actions, audit trail, uploads, scenario application, manual submit logic.
- `src/engine/recalc.ts`: recalculation engine for holdings, trades, FX, income, GL, trial balance, P&L, balance sheet, NAV, exceptions.
- `src/types.ts`: module IDs and domain models.
- `src/data/sampleData.ts`: institutional sample data.
- `src/styles.css`: dark terminal-style UI.
- `TAB_IMPLEMENTATION_MAP.md`: implementation map and project notes when present.

## Local Run

Use these commands for user guidance:

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

If local access control is enabled, `.env` should contain:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_APPROVED_EMAILS=your-approved-email@example.com
```

Do not commit real secret keys.

## Build And Push

Validate with:

```bat
npm run build
```

When telling the user how to push, give exact commands and stage only changed project files, not broad untracked folders:

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
git add src\App.tsx src\styles.css src\types.ts src\store\fundStore.ts src\engine\recalc.ts src\data\sampleData.ts
git commit -m "Describe the simulator enhancement"
git push
```

Use the specific file list for the actual change. Do not use `git add .` when untracked docs or project skill folders exist unless the user explicitly wants them included.

## Current Product Model

The simulator should behave like an institutional fund administration operating environment:

- Trade booking to holdings to pricing/FX to accruals/corporate actions.
- GL auto-postings to trial balance, P&L, balance sheet, NAV.
- Investor capital, subscriptions/redemptions, management fees, performance fees, equalization, waterfall.
- Reconciliation breaks, exception queue, workflow approval, audit trail, AI Copilot.
- Sandbox and Live Mode.
- Scenario Simulation tab for practice and operational impact.
- Full NAV Pack export as a multi-sheet institutional workbook.
- Fund Structure Comparison supports standalone, master-feeder, side-by-side, FoF, hybrid, and multi-strategy structures.

## Enhancement Pattern

When adding a new feature:

1. Add domain models only if needed in `src/types.ts`.
2. Add sample or derived institutional data using existing state first.
3. Connect edits through `fundStore` update actions and `manualBaseline` audit flow where values are user-editable.
4. Extend `recalculate` when NAV, GL, TB, P&L, balance sheet, or exceptions must change.
5. Add screen components in `src/App.tsx` using `PanelTitle`, `SimpleRows`, `EditableNumber`, `EditableText`, `ManualSubmitBar`, `Metric`, and existing dark UI patterns.
6. Update `ModuleContent` routing.
7. Update `exportRowsForModule` for tab download support.
8. Update `buildInstitutionalNavPack` if the feature should appear in the Excel NAV Pack.
9. Run `npm run build`.

## NAV Pack Rules

The NAV Pack should be audit-ready and operationally connected. Add sheets for new institutional workflows rather than simple CSV-style dumps. For major features include:

- Input assumptions
- Working calculation
- Investor/partner-level detail
- GL/TB/NAV tie-out
- Control checks
- Exception or approval status
- NAV bridge where relevant

Sheet names must be Excel-safe and preferably under 31 characters.

## UX Rules

- Keep tables dense and useful.
- Show values in K/M/B/T formatting where possible.
- Use green for success, amber for warning, red only for critical.
- Use editable cells only where user intervention is meaningful.
- Add submit/recalculate workflow where manual edits should be formally submitted.
- Avoid oversized marketing-style sections.
- Keep AI Copilot contextual and operational, not a generic chatbot.

## Common User Guidance

For how do I see changes?:

1. Run local dev server with `npm run dev`, or push to GitHub and wait for Vercel redeploy.
2. Open the relevant sidebar tab.
3. Refresh browser if needed.
4. For Vercel changes, use the production link after deployment is Ready.

For what link can I share?:

Use `https://syed-fund-simulator.vercel.app`.

For people can access without email:

Check Vercel env vars and redeploy. Confirm `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_APPROVED_EMAILS` exist in Vercel project environment variables and production deployment is current.


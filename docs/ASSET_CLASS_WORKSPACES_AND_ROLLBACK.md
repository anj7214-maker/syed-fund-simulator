# Asset-Class Workspaces: Release and Rollback

## Purpose

An additive, reversible navigation layer around the existing FundOps Lab accounting engines. No accounting book, calculation, posting permission or persistence key is migrated or reset.

## Routes

- `/`: Public Home, asset-class selection and pathway choice. Does not submit visitor details.
- `/hedge-fund`: Hedge-fund-only sidebar, header, metrics, Copilot and workflows.
- `/real-estate`: Standalone real-estate header, its own grouped left sidebar and accounting workspace. No hedge-fund tabs or metrics. The two horizontal navigation rows are replaced by sidebar groups and an active-area breadcrumb in this standalone view.

Both workspaces still require the existing VisitorGate registration. This is not secure authentication, verified email, subscription enforcement or corporate authorization. No new login or payment service is introduced.

## Pathways

Student defaults to essential navigation; `All operating areas` reveals every existing area. Core accounting, reconciliation, NAV, approvals and audit remain available. Professional shows all areas. Changing pathway is a display preference only: it cannot change approval permissions, Live/Sandbox mode or financial data. Operational shortcuts may open advanced areas even when the default list is reduced.

`Home / Switch Workspace` returns to asset-class selection. Browser Back/Forward works. URL reloads work through narrow Vercel rewrites for the two workspace paths; API endpoints are not rewritten. Home remembers the pathway and last selected workspace. Hedge-fund navigation remembers the last module; Real Estate reopens its Overview with the existing saved book intact.

## Data Boundaries

- Existing hedge-fund Zustand persistence is unchanged.
- Real Estate remains in `fundops-real-estate-books-v1`, with independent Live and Sandbox books.
- New `fundops-workspace-navigation-v1` stores only navigation preferences.
- Unsaved, unsubmitted form input is not a posted record. Finish/save a proposal before leaving a workspace; saved proposals remain in the existing book.
- Preview screenshots use synthetic demonstration data. They are not live figures.

## Recall / Rollback

### Immediate feedback comparison

Open `/?layout=legacy` to restore the previous combined sidebar for that visit. Remove the query parameter or open `/` to return to separated workspaces. This does not bypass registration or permissions and does not reset books. The Home footer also provides a `Classic workspace` link.

### Production-wide rollback

Set `VITE_ASSET_CLASS_WORKSPACES=false` in Vercel for Production and redeploy. Vite configuration is build-time: saving the variable alone does not change the live build. Default/unset or `true` enables separated workspaces. The two direct routes also render the classic application when the flag is disabled.

Alternatively, promote the previous known-good Vercel deployment. The pre-change baseline is commit `0fa4589f9a65890f1135c8d2b0e3d31ab181b02a`, deployment `2TMEwnWJdzvrmHJnVQQgVRiZEdcR`. Only use this exact baseline if no later unrelated production fixes need retaining.

No rollback step should clear localStorage, revert financial transactions, delete profiles or reset Live/Sandbox books. Avoid `git reset --hard`.

### Reversibility Files

- Added: `src/workspaces/`, `public/workspace-previews/`, `vercel.json`, navigation tests, this document and the scoped deployment script.
- Amended: App entry point/sidebar and optional pathway filtering in RealEstateWorkspace. `src/realEstate/Sidebar.tsx` and `sidebar.css` provide the new Real Estate-only sidebar; the classic embedded view retains its horizontal navigation.
- Accounting engines/stores and VisitorGate remain unchanged.

## QC / Release

Run `node scripts/test-workspace-navigation.mjs`, `node scripts/test-real-estate.mjs`, and `npm.cmd run build`.

Browser checks: Home -> registration/return -> both workspaces; no cross-asset navigation or metric leakage; Student/Professional switch and all-area reveal; deep-route reload; Back/Forward; legacy feedback route; desktop/narrow layout; unchanged saved accounting figures.

Use `deploy-asset-workspaces.cmd` in normal CMD for scoped publishing. It rejects pre-staged unrelated changes and runs QC/build before commit/push. Verify Vercel's exact commit is Ready/Current and the production URLs before announcing release. Do not deploy the restricted-runner `.verification-dist` output.

### Local Verification: October 13, 2026

- 15 navigation/rollback/preference checks and 46 existing Real Estate accounting checks passed.
- TypeScript passed; restricted-runner verification bundle built successfully.
- Home screenshots loaded, both workspace selection actions were visible in the observed desktop viewport.
- Direct `/hedge-fund` and `/real-estate` reloads worked; browser Back/Forward worked.
- Hedge Fund sidebar contained no Real Estate entry. Real Estate had no hedge-fund sidebar or metrics; all 22 internal tabs rendered in Professional pathway without browser errors.
- Student essentials / All operating areas and Professional switches worked. These did not change demonstration approval role or posted baseline NAV.
- Classic layout restored the existing combined sidebar. Fresh-origin direct workspace access showed the existing visitor form; Home remained public.
- No new accounting transaction was posted by this navigation QC. Existing hedge-fund and Real Estate baseline figures remained unchanged.
- Standard `npm.cmd run build` hit the Codex runner's `spawn EPERM` subprocess restriction. Normal CMD/Vercel build remains a release gate.
- Browser viewport override did not apply to the observed test surface (it continued reporting 1707px). Responsive CSS is supplied, but true mobile-size validation remains outstanding.
- This navigation change has not been pushed or deployed yet.

### Real Estate Sidebar Follow-Up: October 13, 2026

The separation baseline is now local commit `bdb854c2695dfb0e383c0b67230ba44e3e5da5f5` (tracked with origin/main). Deployment of that commit was not checked during this sidebar amendment. The new sidebar amendment is local and uncommitted at the time of this note.

Real Estate now mirrors the hedge-fund sidebar pattern: brand lockup, six expandable groups, active tab, independent collapse/expand state and mobile menu controls. Professional exposes all 22 tabs. Student essentials remain available; All operating areas restores the complete list. Breadcrumbs and workflow shortcuts select the same existing tab state, with no accounting changes.

QC: all 22 sidebar links rendered their existing screens with active-page highlighting and no observed browser errors; Student reveal and classic horizontal rollback passed. The 15 navigation checks, 46 accounting checks, TypeScript and verification bundle passed. Standard production build remains blocked inside the runner by `spawn EPERM`; run the scoped CMD deployment script before release. True mobile-device verification is still outstanding.

The global classic-navigation flag/query remains available. To undo only the sidebar while retaining separated pages, revert this sidebar-only release commit after it is created, or restore/promote the separation baseline after verifying it is the appropriate known-good deployment. Do not reset books or delete stored proposals.

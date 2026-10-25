# Mobile Workspace Refinement

## Scope
Local implementation for review, not authorized for deployment yet.
Both asset-class workspaces retain their existing accounting engines, stores,
registration, permissions, environments, exports and desktop navigation behavior.
No new dependencies were installed.

## Changes
- Shared mobile Modules drawer with native dialog focus containment, background
  inertness, scroll locking, Close/Escape and focus restoration.
- Section headings expand without selecting their first tab or closing the drawer.
- Search works only on the existing permitted navigation tree. Student essentials
  and All operating areas remain explicit preferences, not authorization controls.
- Current section and tab stay visible in a sticky module bar.
- Mobile headers keep Live/Sandbox visible; other status/role controls use a
  disclosure. Workspace switching and pathway preferences remain available.
- Existing table wrappers gain local scrolling, sticky headers/first columns,
  overflow affordances and a read-only Record details view. Original filters,
  sort controls, editable cells and workflow actions remain in the original table.
- Primary buttons and form inputs are enlarged on mobile. Copilot's floating
  launcher is hidden while an input is focused. No Copilot logic was changed.
- Source registration and database-monitor code are not modified.

## Local Preview
Run the existing Vite app on 127.0.0.1:5173 and local API on 127.0.0.1:8787.
Registration in this preview uses the existing local visitor endpoint.
Use synthetic details only. This preview is not the live Vercel site.

## Rollback
Set VITE_MOBILE_WORKSPACE_V2=false and restart/rebuild Vite. The previous mobile
sidebars, header controls and styling are restored. This flag changes presentation,
not permission or accounting rules. Remove the flag to enable the refinement again.

For source rollback, restore only reviewed mobile feature hunks and remove the
new MobileWorkspace/mobileNavigation components, CSS, focused test and this note.
Do not run git restore on whole existing files: the checkout contains unrelated
changes and a historical HEAD. Compare against the deployed release when committing.

## QC Boundaries
Run:
- node scripts/test-mobile-navigation.mjs
- node scripts/test-workspace-navigation.mjs
- node scripts/test-real-estate.mjs
- node scripts/test-pull-calculators.mjs
- npm run build

Browser acceptance covers 360/390/430px CSS phone viewports, tablet and desktop,
both workspaces, search and empty results, group expansion, tab selection,
Escape/focus restoration, table details, local overflow and registration.
Do not claim physical iOS/Android keyboard testing from desktop emulation.
Native keyboard behavior and device safe areas still need a physical-device pass.
Navigation success does not establish correctness of every financial workflow.

## Verified Local Results (2026-10-25)
- 115 checks passed: 12 mobile navigation, 15 workspace navigation,
  46 real-estate financial and 42 calculator checks.
- Both workspaces fit 360, 390, 430, 767 and 1280 CSS-pixel widths without
  page-wide horizontal overflow. Phone content begins at approximately 239px,
  compared with approximately 528px in the initial audit.
- Verified section expansion without navigation, permitted-tree search,
  empty search results, tab selection, Escape, focus restoration, table row
  details and local synthetic registration.
- Final screenshots are in .impeccable/review/mobile-hedge-final.png,
  mobile-modules-final.png and mobile-real-estate-final.png.
- Physical-device keyboard and Safari checks remain outstanding.
- No deployment or production-data changes were made.

## Usability Follow-Up (Local, 2026-10-25)
- Phone dashboard shows four primary metrics, one queue action and three leading
  NAV-impacting issues. Workflow and supporting analysis remain expandable;
  desktop keeps the complete dashboard.
- Workflow stages open the relevant existing modules and return focus/scroll to
  the new module heading. These shortcuts never approve or publish by themselves.
- Pricing records precede actions and collapsed uploads on phones; desktop keeps
  its previous order. Download actions remain available in a disclosure.
- Price controls have record/field labels; the Copilot launcher is named.
- Search aliases find cash breaks, bank mismatches and journal entries without
  adding modules outside the supplied permitted navigation tree.
- Record names include entity/account/currency where present. Read-only source
  actions forward to the original enabled buttons. Edit shortcuts focus the
  original grid control; no parallel editor or posting mechanism was added.
- Real Estate shows the current demonstration role on phones and explains why
  publication is unavailable. Existing role and accounting checks are unchanged.
- Passed 121 automated checks: 18 mobile, 15 workspace, 46 real-estate and
  42 calculator checks. Final production build succeeded; the existing bundle-size
  warning remains. UI detector returned no findings.
- Browser verified source trace forwarding, edit-focus return, cash-break search,
  workflow-to-pricing navigation, role display and disabled publication guidance.
- Both workspaces had no page-wide overflow at 360/430/768/1280 CSS pixels.
  Desktop navigation remained present at 1280px.
- At 390px, the collapsed Hedge Fund dashboard measured 1737px (previously 9678px).
  First pricing input is around 519px from the top (previously 1708px).
- Chrome became unavailable mid-QC; remaining checks used the in-app browser.
  Only synthetic local registration details were submitted; promotional consent
  was not selected. No production records were changed.
- Screenshot: .impeccable/review/mobile-usability-dashboard.png.
- These follow-up changes are not committed, pushed or deployed. Physical-device
  keyboard/Safari testing remains outstanding.


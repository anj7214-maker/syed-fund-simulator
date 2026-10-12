# FundOps Lab Workspace Video Previews

## Scope

Only public Home asset-class previews changed. No accounting engines, source books, permission checks, registration, Copilot, exports or operational workflows changed. Existing asset-class selection and pathway controls remain available.

These are prerecorded screen-capture walkthroughs, not live running simulations or continuous desktop recordings. Actual synthetic Sandbox screens were captured after operating the application, then assembled into silent WebM clips with scene captions, focused camera crops, gentle 4.5% camera moves, 360ms dissolves, source-field outlines and a chapter timeline. No continuous cursor recording or click animation is implied. Camera movement does not interpolate monetary values or change the underlying records.

## Walkthroughs

- Hedge Fund: approximately 20 seconds, 1280x720, 3,519,012 bytes. Sandbox Command Center -> pricing source -> MSFT price 421.80 to 371.18 -> holdings -> NAV/share result. Actual NAV/share changes from 1363.4340 to 1362.9858; unresolved controls still hold release. This is not a published NAV demonstration.
- Real Estate: approximately 21 seconds, 1280x720, 3,647,528 bytes. Overview -> property valuation incident -> correction evidence -> submitted SME review queue -> posted overview -> NAV working. Independent review and Controller approval were performed between the captured queue and posted overview frames; the clip does not show every click. The posted USD1,200,000 loss takes NAV from USD35,010,754.21 to USD33,810,754.21; investor capital ties to that NAV. No NAV publication was performed.

Approximate encoded durations can differ slightly from scene timing. Some native WebM recordings expose duration only after playback reaches the end.

## Playback Rules

- Both previews autoplay independently when at least half visible. No selection, hover or Play click is required under normal browser settings; narrow window width no longer blocks playback.
- Videos are silent, looping and inline, with Play/Pause and an enlarged viewer.
- Playback pauses while the page is hidden or the preview is less than half visible.
- Reduced-motion preferences and supported data-saving connections require explicit Play. Explicit Play does not override visibility, Pause or an obscuring enlarged viewer. Browser autoplay blocking retains the Play control as a fallback.
- Enlarged viewer has Close, Escape, keyboard focus trapping and focus restoration; no native full-screen permission is needed. The other preview pauses while it is obscured by that viewer.
- No video source is assigned until playback is allowed. Poster images remain until decoding succeeds and reappear on media errors.
- Unsupported WebM browsers retain the static poster. MP4 transcoding and native iOS/Safari testing are not part of this release.

## Data Safety

Capture used localhost:5174, separate from 127.0.0.1 and production local storage. Registration used synthetic demo@example.invalid details against the local mock API, not the production visitor database. All incident evidence is synthetic. Screenshots start after registration; credentials, personal emails and real client records are absent.

The published WebM files are public assets. Never replace them with recordings containing client data, private audit records, API credentials or real visitor details. The preview player neither runs a simulation nor writes to any book.

## Regeneration

1. Capture approved synthetic Sandbox screens into ignored `.data/preview-captures/` using the filenames listed in `scripts/render-workspace-previews.mjs`.
2. Keep captions aligned with actual visible records and calculations. Do not claim approvals or release that were not performed.
3. Run `node scripts/render-workspace-previews.mjs` from the project.
4. Open the printed localhost URL (default http://127.0.0.1:5190/), click Render Hedge Fund, then Render Real Estate.
5. The browser uses native canvas capture/MediaRecorder at 24fps and a target bitrate of 2Mbps; no new dependencies or microphone permissions are required. Each scene's normalized crop, actual source-field focus and caption metadata are in the existing server script. The loopback-only server validates origin, filenames, file size and WebM signature and closes after saving both files.
6. Inspect both clips, run tests and build, then publish only approved public assets. The source screenshots are ignored and not included in the scoped release.

Browser support is checked using the native MediaRecorder MIME API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static

## Rollback

- Immediate feedback comparison: open Home with `?previews=static`. No videos are mounted; original posters remain.
- Deployment-level rollback: set `VITE_WORKSPACE_PREVIEWS=false` in the relevant Vercel environment, then rebuild/redeploy. Do not reuse an existing bundle because Vite variables are build-time values.
- This flag changes only Home previews, not the asset-class workspace separation. The existing `?layout=legacy` navigation rollback remains independent.

## QC, October 13, 2026

- 16 preview policy/media checks passed (77 checks across the three suites).
- 15 workspace-navigation checks passed.
- 46 Real Estate engine/QC checks passed.
- TypeScript checks passed.
- Verification-only Vite bundle succeeded and was exercised at http://127.0.0.1:5174/.
- Browser verified both 1280x720 clips decode and automatically run without clicks, independent Pause, enlarged-view isolation/Close, looping, and static rollback with zero mounted videos.
- Narrow breakpoint tested with the browser viewport override: actual CSS viewport reported 487px (requested 390px). The visible Hedge Fund clip autoplayed; scrolling the Real Estate preview into view triggered playback without Play. No horizontal overflow appeared. This is not physical-phone validation.
- Reduced-motion and save-data behavior tested through the pure playback policy, not a physical device/network setting.
- Mechanical UI detector returned no findings. No new runtime packages were installed.
- Normal `npm run build` reached Vite but failed with the runner's existing `spawn EPERM` Windows sandbox restriction. Run it in ordinary CMD before committing/deploying. `.verification-dist` is diagnostic only and must never be deployed.
- Production deployment has not been performed for this change. Verify Vercel Ready and production Home playback after pushing.

Run `deploy-workspace-previews.cmd` in ordinary CMD for scoped checks, production build, commit and push. It refuses pre-existing staged changes and does not stage unrelated working-tree changes.

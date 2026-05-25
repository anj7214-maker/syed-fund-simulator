# SYED FUND SIMULATOR Project Operations

## Links

- GitHub repo: `https://github.com/anj7214-maker/syed-fund-simulator`
- Shareable Vercel URL: `https://syed-fund-simulator.vercel.app`
- Local URL: `http://127.0.0.1:5173`

Only share the Vercel URL with other users. Localhost works only on Syed's computer.

## Project Path

```bat
C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge
```

## Run Locally

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm run dev
```

If the terminal asks `Terminate batch job (Y/N)?`, type `Y` when stopping the server.

## Build And Verify

```bat
node node_modules\typescript\bin\tsc -b
npm.cmd run build
```

Warnings about `"use client"` from dependencies are non-blocking if the build finishes successfully.

## Git Push

```bat
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
git add .
git commit -m "Describe the change"
git push
```

If Git says `not a git repository`, the terminal is in the wrong folder.

If Git says it cannot create `.git/index.lock`, close other Git tools or terminals and retry.

## Access Control

Required Vercel environment variables:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_APPROVED_EMAILS=your-approved-email@example.com
```

Add more users as comma-separated emails:

```text
your-approved-email@example.com,person1@email.com,person2@email.com
```

After changing Vercel environment variables, redeploy.

## Recent Important Fixes

- Added email-approved access control with Clerk.
- Added AI Copilot as a sidebar module.
- Made Copilot conversational.
- Added dynamic suggested operational questions engine.
- Fixed Copilot black screen caused by recursive `CopilotChatSurface` rendering.

## Known Safety Rule

Do not remove or simplify existing institutional workflows while enhancing the app. This simulator should remain accounting-driven, interconnected, and operationally realistic.

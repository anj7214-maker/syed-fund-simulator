@echo off
setlocal
cd /d "%~dp0"
git diff --cached --quiet
if errorlevel 1 (
  echo Other files are already staged. Review them before this release.
  exit /b 1
)
call node scripts/test-workspace-previews.mjs
if errorlevel 1 exit /b 1
call node scripts/test-workspace-navigation.mjs
if errorlevel 1 exit /b 1
call node scripts/test-real-estate.mjs
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
git add src/workspaces/Portal.tsx src/workspaces/WorkspacePreview.tsx src/workspaces/previewPolicy.ts src/workspaces/portal.css public/workspace-previews/hedge-fund.webm public/workspace-previews/real-estate.webm scripts/render-workspace-previews.mjs scripts/workspace-preview-renderer.html scripts/test-workspace-previews.mjs docs/WORKSPACE_VIDEO_PREVIEWS.md deploy-workspace-previews.cmd
if errorlevel 1 exit /b 1
git commit -m "Add synthetic Sandbox walkthroughs to Home workspace previews"
if errorlevel 1 exit /b 1
git push origin main
if errorlevel 1 exit /b 1
echo Pushed. Verify Vercel Ready and both Home previews before sharing.
endlocal

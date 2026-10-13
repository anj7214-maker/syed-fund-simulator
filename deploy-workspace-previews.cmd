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
call node scripts/test-home-demo.mjs
if errorlevel 1 exit /b 1
call node scripts/test-pull-calculators.mjs
if errorlevel 1 exit /b 1
call node scripts/test-workspace-navigation.mjs
if errorlevel 1 exit /b 1
call node scripts/test-real-estate.mjs
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
git add src/workspaces/Portal.tsx src/workspaces/WorkspacePreview.tsx src/workspaces/previewPolicy.ts src/workspaces/portal.css src/workspaces/PremiumHome.tsx src/workspaces/HomeImpactDemo.tsx src/workspaces/homeDemo.ts src/workspaces/premiumHome.css public/fonts public/workspace-previews/hedge-fund.webm public/workspace-previews/real-estate.webm scripts/render-workspace-previews.mjs scripts/workspace-preview-renderer.html scripts/test-workspace-previews.mjs scripts/test-home-demo.mjs docs/WORKSPACE_VIDEO_PREVIEWS.md docs/HOME_REDESIGN.md PRODUCT.md DESIGN.md deploy-workspace-previews.cmd
if errorlevel 1 exit /b 1
git add .gitignore src/calculators src/workspaces/navigation.ts vercel.json scripts/test-pull-calculators.mjs scripts/test-workspace-navigation.mjs docs/PULL_CALCULATORS.md
if errorlevel 1 exit /b 1
git commit -m "Update FundOps Lab public practice tools"
if errorlevel 1 exit /b 1
git push origin main
if errorlevel 1 exit /b 1
echo Pushed. Verify Vercel Ready and both Home previews before sharing.
endlocal

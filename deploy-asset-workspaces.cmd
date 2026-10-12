@echo off
setlocal
cd /d "%~dp0"
git diff --cached --quiet
if errorlevel 1 (
  echo Other files are already staged. Review them before this release.
  exit /b 1
)
call node scripts/test-workspace-navigation.mjs
if errorlevel 1 exit /b 1
call node scripts/test-real-estate.mjs
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
git add src/App.tsx src/realEstate/Workspace.tsx src/workspaces public/workspace-previews vercel.json scripts/test-workspace-navigation.mjs docs/ASSET_CLASS_WORKSPACES_AND_ROLLBACK.md deploy-asset-workspaces.cmd
if errorlevel 1 exit /b 1
git commit -m "Separate asset-class workspaces with reversible navigation"
if errorlevel 1 exit /b 1
git push origin main
if errorlevel 1 exit /b 1
echo Pushed. Verify Vercel Ready and both asset-class URLs before sharing.
endlocal

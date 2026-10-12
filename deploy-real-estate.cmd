@echo off
setlocal
cd /d "%~dp0"
git diff --cached --quiet
if errorlevel 1 (
  echo Other changes are staged. Review those before publishing this workspace.
  exit /b 1
)
call node scripts/test-real-estate.mjs
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
git add .gitignore src/App.tsx src/types.ts src/styles.css src/realEstate scripts/test-real-estate.mjs scripts/verify-real-estate-build.mjs scripts/check-real-estate-workbook.mjs docs/REAL_ESTATE_ACCOUNTING_QC_AND_SOP.md deploy-real-estate.cmd
if errorlevel 1 exit /b 1
git commit -m "Add isolated real estate accounting workspace and controlled NAV workflow"
if errorlevel 1 exit /b 1
git push origin main
if errorlevel 1 exit /b 1
echo Pushed. Verify Vercel Ready and the Real Estate Fund Accounting workspace before sharing.
endlocal

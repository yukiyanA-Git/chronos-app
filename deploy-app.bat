@echo off
title Chronos Deploy

set "NODE_BIN=%USERPROFILE%\.gemini\antigravity\node-portable\node-v22.11.0-win-x64"
if exist "%NODE_BIN%\node.exe" (
    set "PATH=%NODE_BIN%;%PATH%"
)

cd /d "%USERPROFILE%\.gemini\antigravity\scratch\calendar-scheduler"

echo ========================================================
echo [Step 1] Building Chronos app...
echo ========================================================
call npm run build

echo.
echo ========================================================
echo [Step 2] Opening Firebase Login in Browser...
echo ========================================================
call "%NODE_BIN%\node.exe" "%USERPROFILE%\.gemini\antigravity\scratch\calendar-scheduler\node_modules\firebase-tools\lib\bin\firebase.js" login

echo.
echo ========================================================
echo [Step 3] Deploying to Firebase Hosting...
echo ========================================================
call "%NODE_BIN%\node.exe" "%USERPROFILE%\.gemini\antigravity\scratch\calendar-scheduler\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting:chronos-app-d149d

echo.
echo ========================================================
echo SUCCESS! Deployment Complete!
echo URL: https://chronos-app-d149d.web.app
echo ========================================================
pause

@echo off
title Chronos Deploy

set "NODE_BIN=C:\Users\Iwamoto\.gemini\antigravity\node-portable\node-v22.11.0-win-x64"
if exist "%NODE_BIN%\node.exe" (
    set "PATH=%NODE_BIN%;%PATH%"
)

cd /d "C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler"

echo [Step 1] Firebase Login...
call npx firebase-tools login

echo.
echo [Step 2] Firebase Deploy...
call npx firebase-tools deploy --only hosting

echo.
echo Complete! Check the Hosting URL above.
pause

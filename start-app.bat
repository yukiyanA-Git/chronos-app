@echo off
chcp 65001 >nul 2>&1
title Chronos

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

for %%i in ("%APP_DIR%\..") do set "PARENT_DIR=%%~fi"
for %%i in ("%APP_DIR%\..\..") do set "GRANDPARENT_DIR=%%~fi"

set "NODE_BIN="
if exist "%PARENT_DIR%\node-portable\node-v22.11.0-win-x64\node.exe" (
    set "NODE_BIN=%PARENT_DIR%\node-portable\node-v22.11.0-win-x64"
) else if exist "%GRANDPARENT_DIR%\node-portable\node-v22.11.0-win-x64\node.exe" (
    set "NODE_BIN=%GRANDPARENT_DIR%\node-portable\node-v22.11.0-win-x64"
)

if "%NODE_BIN%"=="" exit /b 1

set "PATH=%NODE_BIN%;%PATH%"
cd /d "%APP_DIR%"

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="1" (
    start /b "" npx vite --host
    ping 127.0.0.1 -n 3 >nul
)

start http://localhost:5173
exit /b 0

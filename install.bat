@echo off
chcp 65001 >nul 2>&1
title Chronos Setup

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

powershell -ExecutionPolicy Bypass -NonInteractive -File "%APP_DIR%\setup-shortcut.ps1"

echo.
echo ============================================
echo  Setup complete!
echo  Please check your Desktop for "Chronos".
echo ============================================
echo.
pause

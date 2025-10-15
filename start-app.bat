@echo off
cd %~dp0
powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"
pause
@echo off
set "DIR=%~dp0"
start "" powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%DIR%iniciar.ps1"
exit

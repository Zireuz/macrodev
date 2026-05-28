@echo off
set "DIR=%~dp0"
start /min cmd /c "node "%DIR%server.js""
timeout /t 2 /nobreak >nul
start "" "http://localhost:4000"
exit
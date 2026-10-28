@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dung may chu web (cong 8080)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8080 .*LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo Tat MySQL cua du an (cong 3307)...
node scripts\mysql.js stop

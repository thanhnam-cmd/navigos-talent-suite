@echo off
chcp 65001 >nul
title Navigos Talent Suite
cd /d "%~dp0"
echo === Navigos Talent Suite (Node.js + MySQL 8) ===
if not exist node_modules (
  echo Dang cai dat thu vien...
  call npm install --no-audit --no-fund || goto :err
)
if not exist database\mysql-data\mysql (
  echo Lan dau chay: khoi tao MySQL va CSDL...
  call npm run setup || goto :err
)
if not exist logs mkdir logs
echo Khoi dong may chu web...
start "Navigos Talent Suite - server" /min cmd /c "node server\server.js >> logs\server.log 2>&1"
timeout /t 5 >nul
start "" http://localhost:8080
echo Da mo http://localhost:8080  (dong cua so may chu de dung, hoac chay stop.cmd)
exit /b 0
:err
echo Co loi xay ra. Xem thong bao phia tren.
pause

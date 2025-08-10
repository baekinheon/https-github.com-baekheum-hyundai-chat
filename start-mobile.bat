@echo off
REM ==== H-Talk mobile launcher ====
cd /d %~dp0

REM 1) Detect LAN IPv4 (skip 127.0.0.1 and 169.254.*)
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | ?{ $_.IPAddress -notmatch ''^169\.254'' -and $_.IPAddress -ne ''127.0.0.1'' -and $_.PrefixOrigin -ne ''WellKnown'' } | select -First 1 -ExpandProperty IPAddress)"') do set LAN_IP=%%i
if "%LAN_IP%"=="" (
  echo [!] LAN IP를 찾지 못했습니다. Wi-Fi/LAN 연결을 확인하세요.
  echo 수동으로 IP를 입력하려면: set LAN_IP=192.168.x.y
  pause
  exit /b 1
)

echo [+] Detected LAN IP: %LAN_IP%

REM 2) Install deps (first run only it may take a while)
if not exist node_modules (
  echo [+] Installing dependencies...
  npm install
)

REM 3) Start API server (port 5174)
start "H-Talk API" cmd /k "cd /d %~dp0 && set PORT=5174 && node server.js"

REM 4) Start Vite client on all interfaces with VITE_API_URL pointing to LAN IP
REM    IMPORTANT: --host to allow phone access on same Wi-Fi
start "H-Talk Client" cmd /k "cd /d %~dp0 && set VITE_API_URL=http://%LAN_IP%:5174 && npx vite --host 0.0.0.0 --port 5173"

echo.
echo ===============================
echo 휴대폰에서 접속 주소:
echo   http://%LAN_IP%:5173
echo 같은 Wi-Fi에 연결되어 있어야 합니다.
echo Windows 방화벽 알림이 뜨면 '허용'을 눌러주세요.
echo ===============================
echo.
pause

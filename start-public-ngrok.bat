@echo off
cd /d %~dp0
echo [*] Building frontend...
npm run build
start "H-Talk API+Web" cmd /k "cd /d %~dp0 && node server.js"
echo.
echo [*] 이제 ngrok을 실행해 외부 공개 주소를 받으세요:
echo     ngrok http 5174
echo (ngrok이 없다면 https://ngrok.com 설치 후 'ngrok config add-authtoken <토큰>')
pause

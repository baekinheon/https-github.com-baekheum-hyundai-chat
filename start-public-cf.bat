@echo off
cd /d %~dp0
echo [*] Building frontend...
npm run build
start "H-Talk API+Web" cmd /k "cd /d %~dp0 && node server.js"
echo.
echo [*] 이제 Cloudflare Tunnel로 외부 공개 주소 받기:
echo     cloudflared tunnel --url http://localhost:5174
echo (cloudflared 미설치 시 설치 가이드 참고)
pause

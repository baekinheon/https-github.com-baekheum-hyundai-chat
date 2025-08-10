한 포트(5174)로 프론트+API를 함께 서빙하도록 바꿔, ngrok/cloudflared로 외부에서 접속할 수 있게 하는 패치입니다.
1) ZIP 풀어 덮어쓰기 → 2) src/App.jsx의 API 기본값을 window.location.origin으로 바꾼 뒤 → 3) start-public-ngrok.bat 실행 후 'ngrok http 5174'.

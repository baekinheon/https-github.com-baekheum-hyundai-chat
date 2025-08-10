# GitHub Pages + PWA 배포 패치

이 패치는
- PWA(홈 화면 설치/오프라인 캐시) 추가
- GitHub Pages로 자동 배포 워크플로우 추가
- `VITE_BASE`로 GitHub Pages 하위 경로(`/리포지토리명/`) 대응
- `VITE_API_URL` 환경변수로 API 엔드포인트 주입

## 적용
1) 프로젝트 루트에 이 ZIP을 **덮어쓰기** 후:
```
npm i -D vite-plugin-pwa
```
2) GitHub에 새 리포지토리 생성 후 코드 푸시
3) 리포지토리 **Settings → Pages**: Source = GitHub Actions (자동)
4) 리포지토리 **Settings → Variables → Actions**에 다음 추가
   - **Repository Variables**: `VITE_BASE` → `/리포지토리명/`
   - **Repository Secrets**: `VITE_API_URL` → `https://<API-HTTPS-URL>`

> ⚠️ GitHub Pages는 정적 호스팅이라 **server.js(백엔드)**는 실행되지 않습니다.
> 프론트만 Pages에 올리고, API는 **HTTPS로 외부 공개**가 필요합니다.

## API(백엔드) 공개 방법 예시
- **Cloudflare Tunnel**(무료): PC에서 `cloudflared tunnel --url http://localhost:5174` → 발급된 `https://*.trycloudflare.com`를 `VITE_API_URL`에 넣기
- **ngrok**: `ngrok http 5174` → 발급 `https://*.ngrok-free.app`를 `VITE_API_URL`에 넣기
- **Railway/Render/Fly.io**: `server.js`를 배포(HTTPS/WSS 지원)

## 로컬에서도 설치형(PWA) 테스트
```
npm run dev
```
브라우저 주소창에 "설치" 아이콘 또는 "Add to Home screen" 사용.


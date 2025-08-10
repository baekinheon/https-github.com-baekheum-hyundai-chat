# Subtle Remote Patch
목표: 동료들이 이미 재택인 걸 아는 상황이라, **굳이 재택 언급을 하지 않도록** 만듭니다.

- 상단 WFH 배지와 `· 재택` 표기를 제거 (UI)
- 자동응답 문구에서 `재택/원격/VPN/현장/외근` 같이 노출되는 단어를 **자동으로 제거**
- 지연 시간은 기존과 동일: REPLY_MIN_SEC/REPLY_MAX_SEC (기본 180~300초)

## 적용 (예: D:\1111)
1) 서버 중지: `Ctrl + C`
2) 이 ZIP을 프로젝트 루트에 풀어 **덮어쓰기**
3) 재실행:
```
cd /d D:\1111\hyundai-htalk-pro-bot-history-clean
npm run dev
```
옵션: 원할 때만 재택 언급을 허용하려면 실행 전에
```
set MENTION_REMOTE=1
```
을 설정하세요.

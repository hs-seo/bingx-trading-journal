# Cloudflare Workers 설정 가이드

## 1. Cloudflare 계정 만들기

1. https://dash.cloudflare.com/sign-up 접속
2. 이메일로 무료 계정 생성
3. 이메일 인증 완료

## 2. Workers 생성

1. Cloudflare 대시보드 로그인
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. **Create application** 버튼 클릭
4. **Create Worker** 선택
5. 이름 입력: `bingx-proxy` (원하는 이름)
6. **Deploy** 버튼 클릭

## 3. Worker 코드 수정

1. 배포된 Worker에서 **Edit code** 버튼 클릭
2. 기존 코드 전체 삭제
3. `cloudflare-worker.js` 파일의 내용을 **전체 복사해서 붙여넣기**
4. 우측 상단 **Save and Deploy** 버튼 클릭

## 4. Worker URL 확인

배포 후 나타나는 URL을 복사하세요:
```
https://bingx-proxy.your-subdomain.workers.dev
```

이 URL을 프론트엔드에서 사용합니다!

## 5. 무료 플랜 제한

- **요청 수**: 100,000 요청/일
- **CPU 시간**: 10ms/요청
- **용량**: 충분함

세미나 인원들이 사용하기에 충분합니다!

## 다음 단계

Worker URL을 복사한 후, HTML 파일에서 해당 URL을 사용하도록 수정하면 됩니다.

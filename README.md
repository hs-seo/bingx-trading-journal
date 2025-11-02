# BingX 거래일지 & Pine Script 생성기

BingX API를 활용한 거래 내역 관리 및 TradingView Pine Script 자동 생성 도구

## 🌐 온라인 데모

**https://hs-seo.github.io/bingx-trading-journal/**

브라우저에서 바로 실행 가능! 파일 다운로드 없이 URL 접속 후 본인의 API 키만 입력하면 됩니다.

## 주요 기능

### 데이터 수집
- ✅ BingX Perpetual Futures (USDT-M) 거래 내역 자동 수집
- ✅ BingX Standard Futures 거래 내역 자동 수집
- ✅ 최근 7일 ~ 1년 기간 선택 가능
- ✅ 병렬 처리로 빠른 데이터 로딩
- ✅ 자동 중복 제거

### 거래 분석
- 📊 포지션별 그룹화 및 손익 계산
- 📈 승률, 최대 승리/손실, 평균 보유시간 등 통계
- 💰 일별 거래 요약
- 📝 거래 정보 입력 (진입방식, 감정상태, 규칙준수, 메모)

### 데이터 관리
- 💾 IndexedDB 로컬 저장
- 📥 엑셀(CSV) 다운로드 / 업로드
- 🔄 JSON 백업 / 복원
- ⚙️ 사용자 커스텀 설정 관리

### Pine Script 생성
- 🎯 TradingView Pine Script 자동 생성
- 📍 진입/청산 시점 차트 마킹
- 🔍 심볼별 Long/Short 구분

### RR (Risk/Reward) 계산기
- 📊 다중 진입 지원 (불타기/물타기 전략)
- 🎲 실시간 평균 진입가, 총 수량, 총 금액 계산
- 🎯 손절/익절 기반 Risk/Reward 자동 계산
- 🌈 색상 코딩된 RR 비율 표시 (3:1+ 초록, 2:1+ 파랑, 1:1+ 주황, <1:1 빨강)
- 🔮 추가 진입 시뮬레이션 기능
- 🔄 Perpetual + Standard Futures 현재 포지션 자동 불러오기
- ☑️ 여러 포지션 선택하여 평단 합산 계산

## 설치 및 사용

### 방법 1: 온라인 버전 (권장)
1. **https://hs-seo.github.io/bingx-trading-journal/** 접속
2. API Key와 Secret Key 입력
3. 바로 사용!

### 방법 2: 로컬 실행

**필요한 파일:** `index.html`, `app.js`

```bash
# 1. 파일 다운로드
git clone https://github.com/hs-seo/bingx-trading-journal.git
cd bingx-trading-journal

# 2. index.html을 브라우저로 열기
open index.html  # macOS
# 또는 Windows: start index.html
# 또는 더블클릭으로 실행
```

### API 키 발급 및 설정

1. **API 키 발급**
   - [BingX API 관리 페이지](https://bingx.com/en-us/account/api/)
   - 필요 권한: **Read** (읽기 권한만)

2. **API 키 입력**
   - 환경설정 섹션 열기
   - API Key와 Secret Key 입력
   - "API 키를 브라우저에 안전하게 저장" 체크 (선택)

3. **거래 데이터 가져오기**
   - "새 거래 가져오기" 버튼 클릭
   - 또는 "전체 다시 가져오기"로 모든 데이터 새로고침

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: IndexedDB (로컬 데이터베이스)
- **API**: BingX REST API
- **Crypto**: HMAC-SHA256 (API 서명)

## 버전 히스토리

### v1.1 (2025-11-02)
- ✅ **RR 계산기** 추가
  - 다중 진입 지원 (불타기/물타기)
  - Perpetual + Standard Futures 통합 조회
  - 단일/다중 포지션 선택
  - 시뮬레이션 기능
  - 색상 코딩된 RR 비율
- ✅ GitHub Pages 배포

### v1.0 (2025-11-02)
- ✅ 초기 릴리스
- ✅ Perpetual & Standard Futures 지원
- ✅ CSV 업로드/다운로드
- ✅ Pine Script 생성
- ✅ Standard Futures 청산 로직 수정
- ✅ 미니멀 UI 디자인

## 보안 및 데이터

### 🔒 완전한 클라이언트 사이드 앱

**모든 데이터는 사용자의 브라우저에만 저장됩니다:**
- ✅ API 키는 브라우저 `localStorage`에만 저장 (서버 전송 안 함)
- ✅ 거래 내역은 브라우저 `IndexedDB`에만 저장 (서버 전송 안 함)
- ✅ Cloudflare Worker는 CORS 우회 전용 (데이터 저장/로깅 없음)
- ✅ GitHub Pages는 정적 호스팅만 제공 (서버 로직 없음)

### ⚠️ API 키 보안
- API 키는 절대 공유하지 마세요
- **Read 권한만** 부여하는 것을 권장합니다
- 각 사용자가 본인의 API 키를 직접 입력

### ⚠️ 데이터 백업
- IndexedDB는 브라우저 캐시 삭제 시 손실될 수 있습니다
- 정기적으로 **JSON 백업**을 권장합니다
- CSV/JSON 다운로드는 사용자 PC/폰에 저장

## 라이선스

MIT License

## 작성자

Zorba

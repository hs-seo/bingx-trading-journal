# BingX 거래일지 & Pine Script 생성기

BingX API를 활용한 거래 내역 관리 및 TradingView Pine Script 자동 생성 도구

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

## 설치 및 사용

### 1. API 키 발급
BingX에서 API 키를 발급받으세요:
- [BingX API 관리 페이지](https://bingx.com/en-us/account/api/)
- 필요 권한: Read (읽기 권한만 필요)

### 2. 프로젝트 실행
```bash
# 프로젝트 디렉토리로 이동
cd BingX거래일지

# 브라우저에서 index.html 열기
open index.html
```

### 3. API 키 설정
- 환경설정 섹션 열기
- API Key와 Secret Key 입력
- "API 키를 브라우저에 안전하게 저장" 체크 (선택)

### 4. 거래 데이터 가져오기
- "새 거래 가져오기" 버튼 클릭
- 또는 "전체 다시 가져오기"로 모든 데이터 새로고침

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: IndexedDB (로컬 데이터베이스)
- **API**: BingX REST API
- **Crypto**: HMAC-SHA256 (API 서명)

## 버전 히스토리

### v1.0 (2025-11-02)
- ✅ 초기 릴리스
- ✅ Perpetual & Standard Futures 지원
- ✅ CSV 업로드/다운로드
- ✅ Pine Script 생성
- ✅ Standard Futures 청산 로직 수정
- ✅ 미니멀 UI 디자인

## 주의사항

⚠️ **API 키 보안**
- API 키는 절대 공유하지 마세요
- Read 권한만 부여하는 것을 권장합니다
- 브라우저 로컬 스토리지에 저장됩니다 (Base64 인코딩)

⚠️ **데이터 백업**
- IndexedDB는 브라우저 캐시 삭제 시 손실될 수 있습니다
- 정기적으로 JSON 백업을 권장합니다

## 라이선스

MIT License

## 작성자

Zorba

# 📄 예스폼(Yesform) 무료 서식 크롤러 & 다운로더

예스폼(`yesform.com`)의 무료 서식 메타데이터 파싱 및 포맷별(PDF, HWP, DOC, XLS) 실물 파일 다운로드를 지원하는 CLI 도구입니다.

## 📌 주요 파일
- `yesform_crawler.py`: 핵심 크롤러 엔진 및 CLI 인터페이스

## 🚀 사용법 예시

### 1. 아웃라인 파일에서 1~N번 서식 다운로드 (PDF)
```bash
python .agents/tools/crawler/yesform/yesform_crawler.py \
  --outline "c:\망고독 관련 자료\프로젝트_매니지먼트\What-s-in-my-head\3.📦(Resource) 자료\📑 문서_서식_수집_파이프라인\2.sketch\예스폼 - 무료 회의록 리스트.outline" \
  --limit 5 \
  --format pdf \
  --download \
  --cookie "PHPSESSID=...; login_cookie=..."
```

### 2. 검색어로 무료 서식 목록 탐색 (메타데이터만)
```bash
python .agents/tools/crawler/yesform/yesform_crawler.py \
  --search "회의록" \
  --pages 2
```

### 3. 특정 상세 URL들의 포맷 파싱
```bash
python .agents/tools/crawler/yesform/yesform_crawler.py \
  --urls "https://www.yesform.com/forms/vform_128700.php" \
  --format hwp
```

## ⚠️ 핵심 확인 사실 및 인증 가드레일
1. **무료 서식도 로그인 필수**:
   - 예스폼은 무료 서식이라도 비로그인 상태의 다운로드 요청(`dw_form.php`)에 대해 `alert("로그인 하신 회원만 이용 가능 합니다.")` HTML을 반환합니다.
   - 브라우저에서 무료 회원 로그인 후 `F12(개발자도구) -> Application -> Cookies`의 쿠키 문자열을 `--cookie` 인자로 전달해야 파일이 정상 수신됩니다.
2. **검색어 인코딩**:
   - 검색 URL 파라미터(`q=`)는 `EUC-KR`로 인코딩되어 전송됩니다.
3. **서버 딜레이**:
   - 요청 간 1.0초 이상의 딜레이(`--delay 1.0`)를 강제하여 서버 차단을 방어합니다.

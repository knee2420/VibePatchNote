---
유형: 자료
구역: 3.resource
분류:
  - 📑 문서_서식_수집_파이프라인
주제:
  - 서식 수급처
  - 과금 모델 기준 [다중 선택]
  - 무료
상태: 정리
요약: 서식을 한곳에 모아 둔 무료 허브 10곳 (국내 공공 4 · 해외 6). 2026-10-25 에 실제 브라우저로 열어 목록·건수·이용 조건을 확인하고 화면을 찍었다
작성일: 2026-10-25
마감:
커버: "[[무료 서식 허브 01 - 대한법률구조공단 법률서식.png]]"
상위: "[[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크]]"
링크:
  - https://www.klac.or.kr/legalinfo/legalFrm.do
  - https://www.law.go.kr/LSW/lsBylSc.do
  - https://www.ftc.go.kr/www/selectBbsNttList.do?bordCd=201&key=202
  - https://www.nts.go.kr/nts/ad/nf/nltFormatApiList.do?mi=40178
  - https://commonpaper.com/standards/
  - https://www.vertex42.com/ExcelTemplates/
  - https://www.notion.com/@notion
  - https://www.atlassian.com/software/confluence/templates
  - https://extensions.libreoffice.org/?Tags%5B%5D=118
  - https://www.score.org/templates/
담당:
  - "[[민규 서]]"
작성자:
  - "[[Claude]]"
---

# 무료 서식 허브 Top 10

> **분류 기준**: 과금 모델 기준 [다중 선택] → 무료
> **상위 정의**: [[디지털_문서_서식_플랫폼_정의_및_글로벌_벤치마크]]
> **고른 기준**: 서식 한 장이 아니라 **서식 목록이 펼쳐지는 허브 페이지**. 분류·검색으로 여러 서식을 둘러볼 수 있어야 하고, 보거나 받는 데 돈이 들지 않아야 한다.

%%
확인 방법 (2026-10-25, Claude)
- 링크는 전부 실제 브라우저로 열어 서식 목록이 뜨는지 봤다. 건수·이용 조건은 그 화면에 적힌 것을 옮겼다.
- 캡처는 Edge(헤드리스)로 그 페이지를 1280px 폭으로 찍고 위아래 여백만 잘랐다. 그림 위에 덧그린 것은 없다.
  찍은 주소·시각·sha256 은 `이미지/capture_manifest.json` 에 있다 (VibePatchNote `.agents/tools/obsidian/source_hub/01_capture_hub_page.py`).
  SCORE 는 Cloudflare 가 헤드리스 브라우저를 막아서, 옵시디언 옆 내장 브라우저 화면을 그대로 저장했다 (800px).
- 건수는 그날 기준이다. 사이트가 늘리거나 줄이면 달라진다.
- 이전 판(Antigravity, 같은 날)의 "검증 캡처"는 PIL 로 그린 가짜였고 링크 10개 중 3개가 404 였다. 그 판은 통째로 버렸다.
%%

| # | 허브 | 무엇이 있나 (확인한 숫자) | 이용 조건 (페이지에 적힌 것) | 포맷 |
| --: | --- | --- | --- | --- |
| 1 | 대한법률구조공단 법률서식 | 법률서식 2,148건 · 분야 24개 | 공공누리 2유형(출처표시) | 다운로드 · 바로보기 |
| 2 | 국가법령정보센터 별표·서식 | 법령 별표·서식 39,961건 | 정부 공공 서식 | HWP · PDF |
| 3 | 공정거래위원회 표준계약서 | 게시판 6종 (표준약관만 99건) | 공공저작물 아님 → 자유 이용 | 파일 · 문서뷰어 |
| 4 | 국세청 세무서식 | 세법 등 19개 법령별 서식 (개별소비세법만 81건) | 국가법령정보센터 서식으로 연결 | PDF 등 |
| 5 | Common Paper | 표준 계약 12종 + 부속 문서 8종 | CC BY 4.0 | 웹 · 다운로드 |
| 6 | Vertex42 | 엑셀 템플릿 대분류 6개 + 세부 분야 목록 | 무료 사용, **공개 재배포 금지** | XLSX · Google Sheets |
| 7 | Notion 공식 템플릿 | 노션 제작 템플릿 572개, 전부 "Free"(한국어 화면은 "무료") 표시 | 노션 안에서 복제 | 노션 페이지 |
| 8 | Confluence 템플릿 | 분야별 템플릿 갤러리 (Project · IT · HR · Finance …) | 무료 가입("Get it free") 후 사용 | 컨플루언스 페이지 |
| 9 | LibreOffice 템플릿 | Templates 태그 목록 | 항목마다 라이선스 칸 (예: CC BY 4.0) | Writer · Calc · Impress 파일 |
| 10 | SCORE | 소상공인 템플릿 41건 | 확인한 항목은 가입 없이 바로 다운로드 | PDF 등 (항목마다) |

---

## 국내 공공 허브

### 1. 대한법률구조공단 — 법률서식
* **허브 링크**: https://www.klac.or.kr/legalinfo/legalFrm.do
* **무엇이 있나**: 소장·신청서·준비서면 등 2,148건. 노동 · 주택임대차 · 채권 · 가사소송 · 형사소송 등 24개 분야 탭과 서식제목 검색이 있다. 행마다 `다운로드` · `바로보기` 버튼.
* **이용 조건**: 페이지 하단에 "공공누리 2유형(출처표시)" — 출처를 밝히면 쓸 수 있고, 상업적 이용은 금지된다.
* **파이프라인 관점**: 서식 번호(예: `473-1 임금 청구의 소`)와 분야 태그가 붙어 있어 분류 체계째로 가져오기 좋다. 공공누리 2유형이라 **상용 서비스에 원문을 그대로 싣는 것은 안 된다** — 구조 학습·레퍼런스용.

![[무료 서식 허브 01 - 대한법률구조공단 법률서식.png]]

---

### 2. 법제처 국가법령정보센터 — 별표·서식
* **허브 링크**: https://www.law.go.kr/LSW/lsBylSc.do
* **무엇이 있나**: 법령·시행규칙에 딸린 별표와 서식 39,961건. 법령 · 행정규칙 · 자치법규 탭, 가나다별 · 소관부처별 필터, 다운로드 수가 보인다.
* **이용 조건**: 법령에 붙은 정부 공식 서식.
* **파이프라인 관점**: 국내 공문 서식의 원천이다. 다른 기관(국세청 등)도 이곳 서식을 끌어다 쓴다. 서식마다 근거 법령과 개정일이 붙어 있어 **개정 추적**에 쓸 수 있다.

![[무료 서식 허브 02 - 국가법령정보센터 별표서식.png]]

---

### 3. 공정거래위원회 — 표준계약서
* **허브 링크**: https://www.ftc.go.kr/www/selectBbsNttList.do?bordCd=201&key=202
* **무엇이 있나**: 왼쪽 메뉴에 표준약관 · 표준하도급계약서 · 표준가맹계약서 · 표준유통거래계약서 · 표준대리점거래계약서 · 표준비밀유지계약서 6개 게시판. 표준약관 게시판만 99건이고, 글마다 `파일다운로드` · `문서뷰어`.
* **이용 조건**: 페이지 안내문 — "표준계약서 서식은 … 공공저작물에 해당하지 않으므로 자유롭게 이용할 수 있습니다."
* **파이프라인 관점**: 업종별 계약서가 고시 번호(`제10029호` 등)와 개정일로 관리된다. 이용 조건이 가장 자유로워 **원문째 쓰기 좋은** 국내 소스.

![[무료 서식 허브 03 - 공정거래위원회 표준계약서.png]]

---

### 4. 국세청 — 세무서식
* **허브 링크**: https://www.nts.go.kr/nts/ad/nf/nltFormatApiList.do?mi=40178
* **무엇이 있나**: 법령서식 · 훈령·고시서식 탭. 국세기본법 · 법인세법 · 부가가치세법 · 소득세법 등 19개 법령을 골라 서식 목록을 본다. 행마다 서식번호 · 공포일자 · 첨부파일(PDF 등).
* **이용 조건**: 페이지 안내문 — "세무서식은 법제처 국가법령정보센터 제공 서식이 다운로드 됩니다."
* **파이프라인 관점**: 내용은 2번과 겹친다. **세법만 골라 보는 입구**로 쓰면 된다. 2번에서 세법 서식만 걸러 내기 어려울 때 여기서 법령 목록을 따온다.

![[무료 서식 허브 04 - 국세청 세무서식.png]]

---

## 해외 허브

### 5. Common Paper — Standard Contracts
* **허브 링크**: https://commonpaper.com/standards/
* **무엇이 있나**: Mutual NDA · Terms of Service · Cloud Service Agreement · SLA · DPA · BAA · Professional Services · AI Addendum · Partnership · Software License · Pilot · Design Partner 12종, 그리고 Language Library · Letter of Intent · One-way NDA · Term Sheet · Independent Contractor · Amendment · Statement of Work · Order Form. 분야 탭과 키워드 검색이 있다.
* **이용 조건**: "released for free under the Creative Commons CC BY 4.0 License" — 출처만 밝히면 수정·상업 이용 가능.
* **파이프라인 관점**: 영문 SaaS 계약서 중 **라이선스가 가장 깨끗한** 묶음. 변호사 위원회가 관리한다고 적혀 있다.

![[무료 서식 허브 05 - Common Paper 표준계약.png]]

---

### 6. Vertex42 — Excel Templates
* **허브 링크**: https://www.vertex42.com/ExcelTemplates/
* **무엇이 있나**: Calendars & Schedules · Budgets & Finance · Home & Family · Project Management · Invoices & Forms · Teachers & Students 대분류 6개, 오른쪽에 TEMPLATE CATEGORIES 목록(Attendance · Business · Inventory · Invoices · Resumes …). 페이지 안내 — 대부분 OpenOffice · Google Sheets 판도 있다.
* **이용 조건**: 무료. 다만 사용권 계약(EULA)에 **"anyone with the link" 공유 · SNS · 문서 공유 서비스 게시 금지**라고 적혀 있다. 가족 · 팀 · 회사 안에서만 공유할 수 있다.
* **파이프라인 관점**: 수식 · 조건부 서식 구조를 **보고 배우는 레퍼런스**로만. 수집해서 다시 배포하면 약관 위반이다.

![[무료 서식 허브 06 - Vertex42 엑셀 템플릿.png]]

---

### 7. Notion — 공식 템플릿 (@notion)
* **허브 링크**: https://www.notion.com/@notion
* **무엇이 있나**: 노션이 직접 만든 템플릿 572개 (찍은 화면 기준). 목록의 가격 표시가 전부 "Free"다 (한국어 화면에서는 "무료"). 스터디 플래너 · 가계부 · OKR Tracker 등. 최근에는 AI 스킬 · 에이전트 템플릿이 많이 섞여 있다.
* **왜 이 페이지인가**: 마켓플레이스 전체(`/templates`)는 유료 템플릿이 섞여 있다. **노션 공식 제작자 페이지만 보면 전부 무료**다.
* **파이프라인 관점**: 블록 · 데이터베이스 구조를 보는 레퍼런스. 파일로 내려받는 서식이 아니라 노션 안에 복제하는 방식이다.

![[무료 서식 허브 07 - Notion 공식 템플릿.png]]

---

### 8. Atlassian — Templates for Confluence
* **허브 링크**: https://www.atlassian.com/software/confluence/templates
* **무엇이 있나**: Recommended · Project Management · Software & IT · Product Management · Marketing & Sales · Design · Finance & Ops · Human Resources 탭과 템플릿 검색이 있다. Strategic planning · Project plan · Flowchart · PRD 등 업무 문서 위주.
* **이용 조건**: 템플릿 소개 페이지는 누구나 볼 수 있다. 실제로 쓰려면 컨플루언스 계정이 필요하다 (상단 "Get it free").
* **파이프라인 관점**: PRD · 프로젝트 계획 · 회고 같은 **팀 협업 문서의 목차 구성**을 보기 좋다.

![[무료 서식 허브 08 - Confluence 템플릿.png]]

---

### 9. LibreOffice — Templates 태그
* **허브 링크**: https://extensions.libreoffice.org/?Tags%5B%5D=118
* **무엇이 있나**: LibreOffice 확장 사이트에서 `Templates` 태그만 걸러 본 목록. Writer · Calc · Impress 템플릿이 최신순으로 뜨고 다운로드 수 · 별점이 보인다. 이력서 · 예산표 · 연구 보고서 양식 등 여러 언어.
* **이용 조건**: 항목마다 릴리스 표에 License 칸이 있다 (확인한 예: Monthly Budget and Spending Tracker Lite → CC BY 4.0). **항목별로 다르니 하나씩 봐야** 한다.
* **파이프라인 관점**: 오픈 포맷(ODF) 원본을 받을 수 있는 몇 안 되는 허브. 다만 개인 업로드라 품질이 고르지 않다.

![[무료 서식 허브 09 - LibreOffice 템플릿.png]]

---

### 10. SCORE — Small Business Templates
* **허브 링크**: https://www.score.org/templates/
* **무엇이 있나**: 미국 소상공인 멘토링 비영리단체의 템플릿 41건. SWOT Analysis Worksheet · Business Plan Template for a Startup · 12-Month Profit and Loss Projection · Startup Expenses 등 창업 · 재무 양식.
* **이용 조건**: 확인한 항목(SWOT Analysis Worksheet)은 가입 · 이메일 입력 없이 `Download Template` 버튼이 파일로 바로 연결됐다. 일부 항목에는 "Sponsored by" 표시가 있다.
* **파이프라인 관점**: 사업계획서 · 손익 추정 같은 **창업 실무 양식의 영문 표준형**.

![[무료 서식 허브 10 - SCORE 템플릿.png]]

---

## 넣지 않은 곳 — 왜 뺐나

| 후보 | 뺀 까닭 (2026-10-25 확인) |
| --- | --- |
| Microsoft Create (`create.microsoft.com/…/templates`) | 템플릿 갤러리가 없어지고 `m365.cloud.microsoft/create` (Copilot 로그인 화면)로 넘어간다 |
| Google Docs 템플릿 갤러리 | 로그인해야 보인다. 공개 허브가 아니다 |
| 한국저작권위원회 저작권 표준계약서 | 서식이 4종뿐이다. 허브라 하기 어렵다 |
| 대법원 전자민원센터 양식모음 (`help.scourt.go.kr`) | 도메인이 더는 안 열린다 (DNS 없음). 전자소송포털로 옮겨 간 듯한데 양식 목록 주소는 못 찾았다 |
| Notion 마켓플레이스 전체 | 유료가 섞여 있다 → 7번은 공식 제작자 페이지로 좁혔다 |

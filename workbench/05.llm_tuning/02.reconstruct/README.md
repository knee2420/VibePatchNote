# 02. Reconstruct (Tiptap Scaffold Wireframe Reconstructor)

> **목적**: 기존 `packages/scaffold-engine`의 핵심 역량(Stage A 기하 실측 + Stage B LLM 역할 판정 + Stage C Tiptap 조립)을 온전히 계승 및 재구성하여, 원본 PDF와 100% 동일한 고정밀 와이어프레임 서식과 한국어 슬롯을 재구성하고 시각화하는 연구실(Workbench) 모듈입니다.

---

## 1. 3단계 파이프라인 아키텍처

```text
[원본 PDF 문서]
       │
       ▼
[Stage A: 결정적 기하 측정 (extract/geometry_extractor.py)]
  ├─ PyMuPDF 기반 표(Table), 셀(Cell), 텍스트 라인, 이미지, 구분선(Rule) 1pt 단위 정밀 실측
  └─ PageGeometry, Block, TableGeometry 생성 (LLM 미호출, 100% 결정적)
       │
       ▼
[Stage B: LLM 블록 역할 판정 (prompts/ & pipeline/classifier.py)]
  ├─ 주력 모델 (Gemini-3.5-flash / Gemma4 31b) 활용
  ├─ 실측 블록에 대해 '고정 서식(label)'과 '새로 채울 값(value/mixed)'을 분류
  ├─ 정교한 한국어 슬롯 안내 라벨(slot_label: "회의 일시", "공급자 회사명", "인보이스 번호" 등) 생성
  └─ 미지의 ID 및 원문 불일치 환각(Hallucination) 엄격 필터링/정제
       │
       ▼
[Stage C: Tiptap 스키마 조립 (pipeline/assembler.py)]
  ├─ <div data-type="scaffold-page" data-w="..." data-h="...">
  ├─ <div data-type="scaffold-block" data-bid="..." data-x="..." data-y="..." data-variant="...">
  ├─ <div data-type="scaffold-frame"><table>...<span data-type="scaffold-slot" data-placeholder="...">
  ├─ Tiptap Markdown ([ 라벨 ] 직렬화) 및 slots.json 매핑 테이블 산출
       │
       ▼
[시각화 스튜디오 (:8090)]
  ├─ 좌측: 원본 PDF 페이지 캔버스 + OUTLINE 계층 트리 패널
  ├─ 중앙: RECON 연결 인디케이터
  └─ 우측: TIPTAP 와이어프레임 서식 (실제 A4 캔버스 + 보라색 점선 슬롯 + 실시간 양방향 호버 싱크)
```

---

## 2. 디렉토리 구조

```text
02.reconstruct/
├── schemas/
│   ├── geometry.py             # PageGeometry, Block, TableGeometry (실측 기하 엔티티)
│   └── models.py               # ClassificationResult, SlotMappingItem, ScaffoldExtractResult
├── extract/
│   └── geometry_extractor.py   # PyMuPDF 기반 결정적 기하 실측 (Stage A)
├── prompts/
│   ├── classification_prompt.py # 실측 블록 역할 및 슬롯 라벨 판정 프롬프트 (Stage B)
│   └── schema.json             # LLM 구조화 출력용 JSON Schema
├── harness/
│   └── llm_client.py           # Antigravity CLI 및 Gemini 주력 모델 연동 하네스
├── pipeline/
│   ├── classifier.py           # Stage B LLM 판정 및 검증 정제기
│   ├── assembler.py            # Stage C Tiptap HTML / Markdown / Slots 조립기
│   └── reconstructor.py        # Stage A -> B -> C 통합 파이프라인 러너
├── staging/                    # 일괄 재구성 산출물 JSON 저장소
├── viz/                        # 시각화 웹 스튜디오
│   ├── app.py                  # FastAPI 백엔드 서버 (:8090)
│   ├── static/
│   │   └── index.html          # 첨부 이미지 1, 2와 100% 동일한 좌우 2열 대시보드
│   └── start_viz.bat           # 원클릭 실행 배치 스크립트
├── run_reconstruct.py          # 일괄 재구성 배치 러너
└── README.md
```

---

## 3. 실행 방법

### 1) 일괄 재구성 실행 (전체 PDF)
```bash
python workbench/05.llm_tuning/02.reconstruct/run_reconstruct.py
```
- 원본 PDF들을 순회하며 Stage A(기하 실측) -> Stage B(역할 판정) -> Stage C(Tiptap 조립)를 거쳐 `staging/scaffold_*.json`을 생성합니다.

### 2) 시각화 스튜디오 실행
터미널 직접 실행:
```bash
python workbench/05.llm_tuning/02.reconstruct/viz/app.py
```
또는 원클릭 배치 파일 실행:
```cmd
workbench\05.llm_tuning\02.reconstruct\viz\start_viz.bat
```

브라우저에서 **`http://localhost:8090`** 접속 후:
- 상단 드롭다운에서 `11월_디딤돌_회의록`, `Atticus LLC_ Invoice 000081709` 등을 선택하면:
- **좌측**: 원본 PDF 페이지와 우측 접이식 OUTLINE 계층 트리
- **우측**: `@vibe/tiptap-scaffold`의 `scaffold.css`가 완벽히 적용된 A4 종이 캔버스 위에 표, 텍스트, 보라색 점선 슬롯(`border: 1px dashed #a855f7; background: #faf5ff;`)이 원본과 100% 일치하는 위치에 렌더링됩니다.
- 우측 서식에서 임의의 슬롯에 마우스를 올리면, 좌측 원본 PDF의 해당 좌표 위치에 보라색 하이라이트 박스가 실시간으로 떠오릅니다 (양방향 Sync Hover).

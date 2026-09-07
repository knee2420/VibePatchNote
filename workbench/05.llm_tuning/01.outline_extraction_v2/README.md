# [01.outline_extraction_v2] 차세대 인지적 레이아웃 아웃라인 추출 파이프라인

`01.outline_extraction_v2`는 `antigravity-cli-docs` 공식 아키텍처 및 보편적 인지 분해 원칙을 통합하여 새롭게 구축된 고정밀 문서 아웃라인 추출 파이프라인입니다.

---

## 1. V1 대비 핵심 아키텍처 개선사항

| 구분 | 기존 (V1) | 차세대 (V2) |
| :--- | :--- | :--- |
| **출력 보장** | 정규표현식 기반 취약한 문자열 슬라이싱 (`find('{')`) | CLI 네이티브 `--json-schema` 강제 및 Pydantic V2 자동 역직렬화 |
| **CLI 통신 규격** | 비정형 텍스트 출력 파싱 (`-p prompt`) | `--output-format json` 기반 구조화 엔벨로프 추출 |
| **컨텍스트 공급** | 단순 텍스트 또는 비전 이미지 단독 투입 | **3중 멀티모달 융합**: (1) PyMuPDF 표 기하 메타 + (2) 타이포그래피 블록 + (3) 연속 텍스트 흐름 |
| **프롬프트 튜닝** | 개별 문서 맞춤형 오버피팅 (예: "Header Meta" 하드코딩) | **보편적 인지 분해 원칙**: 목차 vs 본문 분리 기준(Stopping Criteria) 도입 |
| **텔레메트리 관측** | 단순 추정 또는 누락 | 실행별 지연시간(초), 토큰 소비량(입력/출력/추론), 대화 세션 ID 자동 추적 |
| **평가 및 벤치마크** | 단일 파일 단위 수동 스크립트 실행 | 원클릭 다중 문서 벤치마크 매트릭스(`benchmark.py`) 자동 F1 비교 |

---

## 2. 모듈 디렉터리 구조

```text
workbench/05.llm_tuning/01.outline_extraction_v2/
├── schemas/
│   ├── models.py               # Pydantic V2 OutlineItem, OutlineOutput 스키마 정의
│   └── outline_schema.json     # CLI 주입용 표준 JSON Schema (자동 생성)
├── prompts/
│   ├── system_instructions.md  # 보편적 인지 레이아웃 분해 원칙 및 중단 기준 지침
│   └── context_builder.py      # PyMuPDF 기반 3중 멀티모달 컨텍스트 빌더
├── harness/
│   └── cli_client.py           # Antigravity CLI 구조화 호출 및 세션/텔레메트리 래퍼
├── pipeline/
│   └── step1_outline.py        # Step 1 아웃라인 추출 파이프라인 실행 모듈
├── staging/
│   └── step1_outline/          # 모델별 추출 결과 JSON 저장소
├── benchmark.py                # 3대 표준 문서 종합 벤치마크 매트릭스 러너
└── README.md                   # 아키텍처 가이드 (본 문서)
```

---

## 3. 핵심 원칙: 보편적 인지 레이아웃 분해 (Cognitive Decomposition)

1. **목차(Outline / Signpost) vs 본문(Payload / Element)의 엄격한 분리**:
   - 목차는 문서 탐색을 위한 표제·구획 레이블입니다.
   - 회의록의 발언 요약 불릿, 인보이스 품목 리스트, 표 내부 데이터 행 등은 본문(Element)으로 간주하여 목차 노드 수집을 **중단(Stop)**합니다.
2. **원문 표기 충실성 (Literal Verbatim Labeling)**:
   - 가상의 카테고리(`Header Meta` 등)를 임의로 지어내지 않고, 문서 원문에 인쇄된 텍스트를 그대로 보존합니다.
3. **타이포그래피 및 표 기하 융합**:
   - 폰트 크기 및 테두리/박스 기하 정보를 바탕으로 Level 1, Level 2, Level 3 위계를 엄격하게 분류합니다.

---

## 4. 실행 가이드

### 단일 문서 아웃라인 추출
```bash
python workbench/05.llm_tuning/01.outline_extraction_v2/pipeline/step1_outline.py \
  --pdf "workbench/05.llm_tuning/01.outline_extraction/01.dataset/raw/11월_디딤돌_회의록.pdf" \
  --model gemini-3.8-flash-low
```

### 전체 3대 벤치마크 매트릭스 구동 및 채점
```bash
python workbench/05.llm_tuning/01.outline_extraction_v2/benchmark.py \
  --model gemini-3.8-flash-low
```

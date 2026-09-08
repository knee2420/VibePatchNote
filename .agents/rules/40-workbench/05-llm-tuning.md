# Workbench: 05.llm_tuning Guidelines

## 1. 목적
`workbench/05.llm_tuning/`는 VibePatchNote에서 활용되는 핵심 LLM 파이프라인(목차 추출, 세그먼트 스캔, 스캐폴드 생성 등)의 프롬프트, 컨텍스트 빌더, 입출력 스키마를 태스크별로 격리하여 **정량적 정답셋(Ground Truth) 기반으로 최적화·벤치마크하는 튜닝 작업대**입니다.

---

## 2. 태스크별 표준 5단계 라이프사이클

모든 LLM 튜닝 태스크 디렉토리는 동일한 표준 구조를 준수합니다:

```text
workbench/05.llm_tuning/{task_name}/
├── README.md                      # 해당 태스크의 상세 명세, 프롬프트 위치, 평가 기준
├── 01.dataset/                    # 테스트 대상 입력 문서 (raw PDF, 전처리 텍스트/기하 데이터)
├── 02.ground_truth/               # 🎯 인간 전문가가 정의한 이상적인 정답셋 (골든 라벨)
├── 03.baselines_raw_llm/          # 🏛️ 원본 LLM(AS-IS)의 현재 출력 결과 및 편향(Bias) 분석
├── 04.experiments/                # 🔬 프롬프트 개선 및 전략별 튜닝 실험실
└── 05.evaluations/                # 📊 정답셋 대비 정량 채점 스크립트 및 벤치마크 리포트
```

---

## 3. 🚨 절대 준수 원칙 (Strict Rules)

### ① 서비스 지원 모델 기준 준수 (글로벌 헌법)
- ❌ **절대 사용 금지 모델:** `Gemini-1.5`, `Gemini-2.5` 시리즈는 서비스가 종료되었으므로 프롬프트 튜닝, 평가 스크립트, 코드 어디에서도 절대 참조하거나 사용하지 않습니다.
- ✅ **현재 기준 주력 모델:**
  - `Gemma4 31b`
  - `Gemini-3.5-flash`
  - `Gemini-3.1-pro`
  - `Gemini-3.1-flash-lite`
  *(주력 모델은 분기별로 업데이트되므로, 튜닝 및 벤치마크 시 항상 최신 가용 모델군을 기준으로 삼습니다.)*

### ② 느낌이 아닌 측정 기반 튜닝 (Measurement-Driven)
- "프롬프트가 좋아진 것 같다"는 주관적 추측을 전면 금지합니다.
- 반드시 `02.ground_truth` 정답셋 대비 `05.evaluations`의 정량적 지표(F1-score, Recall, 정확도, 파싱 에러율 등)를 계측하여 개선 효과를 입증합니다.

### ③ 태스크 간 격리성 유지
- 서로 다른 LLM 파이프라인 태스크(예: `01.outline_extraction`, `02.segment_scan`, `03.scaffold_generation`)는 독립된 서브 디렉토리로 격리하여 프롬프트와 데이터셋 간의 간섭이나 오염을 방지합니다.

### ④ 브라우저 자동 검증 금지 (토큰 절약)
- 에이전트 자체적으로 웹브라우저(Puppeteer, Playwright 등)를 실행하여 화면을 검증하는 절차를 수행하지 않습니다.
- LLM 튜닝 검증은 파이썬 스크립트 기반의 CLI 실행, API 단위 테스트, 정량 채점 스크립트를 통해 수행합니다.

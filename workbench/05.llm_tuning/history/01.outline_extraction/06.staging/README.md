# 06.staging: Step별 격리 프롬프트 튜닝 샌드박스

## 1. 아키텍처 의도
LLM 문서 구조화 파이프라인에서 성능 저하가 발생했을 때, **어느 단계(Step)에서 문제가 발생했는지 인과 관계를 격리 분석**하기 위해 단계별로 독립된 디렉터리를 구성합니다.

```text
06.staging/
  ├── step1_outline/                 # [Step 1] 아웃라인(목차 계층) 튜닝 영역
  │     ├── step.py                  # Step 1 파이프라인 로직 및 튜닝 대상 프롬프트
  │     ├── run_step1.py             # Step 1 단독 실행 및 Outline Hierarchy F1 채점기
  │     └── output_*.json            # Step 1 단독 추출 결과물
  │
  ├── step2_elements/                # [Step 2] 세부 컴포넌트(엘리먼트) 및 바인딩 튜닝 영역
  │     ├── step.py                  # Step 2 파이프라인 로직 및 튜닝 대상 프롬프트
  │     ├── run_step2.py             # GT 아웃라인 주입 기반 Step 2 단독 실행 및 Element/Binding F1 채점기
  │     └── output_*.json            # Step 2 단독 추출 결과물
  │
  ├── run_staging.py                 # [End-to-End] Step 1 -> Step 2 전체 파이프라인 실행 및 종합 평가기
  └── README.md
```

## 2. 격리 튜닝 워크플로우

### [A] Step 1 집중 튜닝 (Outline Hierarchy 개선)
1. `step1_outline/step.py`의 `_build_prompt`를 개선.
2. `run_step1.py`를 단독 실행하여 **Outline F1** 지표(누락 노드 수, 계층 경로 정합도)만 집중 검증.
```bash
python workbench/05.llm_tuning/01.outline_extraction/06.staging/step1_outline/run_step1.py --doc 11월_디딤돌_회의록
```

### [B] Step 2 집중 튜닝 (Element Extraction & Binding 개선)
- **오차 전파 차단**: Step 1이 불안정하더라도, Step 2 단독 실행기(`run_step2.py`)는 **정답셋(Ground Truth)의 아웃라인을 깨끗한 기준 컨텍스트로 주입**하여 Step 2 모델 자체의 엘리먼트 추출 및 섹션 바인딩 역량만 순수하게 채점합니다.
```bash
python workbench/05.llm_tuning/01.outline_extraction/06.staging/step2_elements/run_step2.py --doc 11월_디딤돌_회의록
```

### [C] 엔드투엔드 파이프라인 검증 (End-to-End Evaluation)
- 각 단계 튜닝이 완료되면 전체 파이프라인을 통과시켜 종합 점수(Overall Composite Score)를 산출합니다.
```bash
python workbench/05.llm_tuning/01.outline_extraction/06.staging/run_staging.py --doc 11월_디딤돌_회의록
```

### [D] 운영 승격 (Production Promotion)
- 검증 완료된 `_build_prompt` 및 지침을 `apps/api/app/documents/pipeline/steps/` 운영 코드로 복사(승격)합니다.

# 🧠 VibePatchNote LLM 튜닝 & 벤치마크 워크벤치 (LLM Optimization Hub)

본 디렉토리(`workbench/05.llm_tuning`)는 프로젝트에서 활용되는 **3대 핵심 LLM 파이프라인 로직을 태스크별로 격리**하여, 각 로직별 정답셋(Ground Truth)과 원본 LLM(Baseline)을 체계적으로 비교·최적화하는 튜닝 작업대입니다.

---

## 🗺️ 프로젝트 LLM 메인 로직 매핑 맵

| 디렉토리 | 담당 기능 및 백엔드 위치 | 주력 모델 | 핵심 역할 |
| :--- | :--- | :--- | :--- |
| **`01.outline_extraction`** | `app/documents/pipeline/steps/` | `gemini-3.5-flash` | 문서의 계층 목차(Outline Tree) 및 5대 컴포넌트(표/폼/목록) 2-Stage 추출 |
| **`02.segment_scan`** | `app/documents/prompts.py` | `gemini-3.5-flash` | 업로드 직후 논리 영역(표, 목록, 본문 섹션) 고속 바운딩 박스 탐색 |
| **`03.scaffold_generation`** | `packages/scaffold-engine` | `gemini-3.5-flash` | PDF 문서를 Tiptap HTML DOM, 마크다운, 입력 슬롯(Slots) 서식 틀로 변환 |

---

## 📂 각 로직별 표준 서브 디렉토리 규칙

모든 LLM 로직은 동일한 표준 라이프사이클 구조를 공유합니다:

```text
{task_directory}/
├── README.md                      # 해당 LLM 태스크의 상세 명세, 프롬프트 위치, 평가 기준
├── 01.dataset/                    # 테스트 대상 입력 문서 (raw PDF, 전처리 텍스트/기하)
├── 02.ground_truth/               # 🎯 인간 전문가가 정의한 이상적인 정답셋 (골든 라벨)
├── 03.baselines_raw_llm/          # 🏛️ 원본 LLM(AS-IS)의 현재 출력 결과 및 편향(Bias) 분석
├── 04.experiments/                # 🔬 프롬프트 개선 및 전략별 튜닝 실험실
└── 05.evaluations/                # 📊 정답셋 대비 정량 채점 스크립트 및 벤치마크 리포트
```

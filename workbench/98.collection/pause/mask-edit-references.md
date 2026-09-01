# Mask Edit & Segment Control 레퍼런스 큐레이션

문서 시뮬레이터에서 '국지적 영역 추출(Mask Extraction)'과 '세그먼트 단위 재생성(Partial Edit/Inpainting)' 기능을 구현하기 위해 기존 아키텍처 가이드(FSD, Bulletproof 등) 외에 추가로 참고해야 할 핵심 기술 스택과 베스트 프랙티스입니다.

---

## 1. 문서의 구조적 파싱 및 블록(Block) 모델링

단순한 텍스트 덩어리(String)에서는 '영역(Mask)'을 특정할 수 없습니다. 문서를 트리 구조(AST)나 블록(Block) 단위로 분리하고 고유하게 식별할 수 있는 기반 기술이 필수적입니다.

### 🧱 Block-based Editor 아키텍처
* **출처**: [BlockNote (Notion-style editor)](https://www.blocknotejs.org/) / [Editor.js](https://editorjs.io/)
* **분야**: 프론트엔드 에디터 및 데이터 구조
* **핵심 내용**: 
  - 문서를 긴 텍스트가 아닌, 독립된 JSON 객체(Block)들의 배열로 관리.
  - 각 블록에 고유 ID를 부여하여 "특정 ID의 블록만 변경(Mask Edit)"하거나 "특정 ID 블록 잠금(Pin)"하는 로직을 쉽게 구현 가능.

### 🌳 AST (Abstract Syntax Tree) 활용
* **출처**: [Unified / Remark & Rehype](https://unifiedjs.com/)
* **분야**: 텍스트 구문 분석 (Markdown 파싱)
* **핵심 내용**:
  - 마크다운이나 HTML 텍스트를 AST 트리로 변환하여 프로그래밍 방식으로 조작.
  - "3번째 문단의 2번째 문장"과 같은 세밀한 구역(Segment)을 정확히 타겟팅하고 그 부분만 치환 및 치수를 측정하는 데 사용.

---

## 2. 상태 동기화 및 핀(Pin) 기능 (불변성 유지)

특정 세그먼트를 핀(Pin)으로 고정하고 다른 부분만 AI가 재생성할 때, 기존 내용과 새로운 내용이 충돌(Conflict) 없이 안전하게 병합되어야 합니다.

### 🔄 CRDT (Conflict-free Replicated Data Type)
* **출처**: [Yjs](https://yjs.dev/) / [Automerge](https://automerge.org/)
* **분야**: 실시간 동기화 및 부분 편집 상태 관리
* **핵심 내용**:
  - 본래 다중 사용자 동시 편집(Co-editing)을 위한 기술이지만, '사용자'와 'AI 에이전트'가 동시에 문서의 다른 부분을 수정할 때 매우 유용함.
  - AI가 재생성하는 동안 사용자가 고정(Pin)해 둔 영역의 무결성을 수학적으로 보장.

---

## 3. 텍스트 Inpainting & AI 프롬프트 엔지니어링

이미지의 마스크 부분만 다시 그리는(Inpainting) 것처럼, 텍스트의 특정 세그먼트만 문맥을 유지한 채 다시 쓰는 기법입니다.

### 🤖 Fill-In-the-Middle (FIM) / Text Inpainting 모델링
* **출처**: [OpenAI / Anthropic API Prompting Guide (Prefix-Suffix-Middle)](https://platform.openai.com/docs/guides/text-generation)
* **분야**: AI 프롬프트 및 API 활용
* **핵심 내용**:
  - 문서를 재생성할 때, 전체 문서를 새로 쓰게 하는 것이 아니라 `[이전 텍스트(Prefix)]`와 `[이후 텍스트(Suffix)]`를 컨텍스트로 주고 `[마스크 영역(Middle)]`만 채우도록 지시하는 프롬프트 기법.
  - 변경할 부분과 유지할 부분(Pin)의 경계선을 매끄럽게 잇는 핵심 기술.

### 🤖 Structured Output (JSON 스키마 강제)
* **출처**: [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
* **분야**: AI 응답 제어
* **핵심 내용**:
  - AI가 특정 세그먼트에 대한 결과물(예: 측정된 통계 수치, 변경된 단락)을 내놓을 때, 미리 정의된 JSON 스키마에 완벽히 맞춰 응답하도록 강제.
  - 시뮬레이터에서 추출된 데이터(길이, 비율 등)를 파싱 오류 없이 UI에 반영하기 위한 필수 조건.

---

## 4. UI/UX: 마스킹 및 시각적 구획 (Spatial UI)

사용자가 직관적으로 "이 부분만!"이라고 마스킹할 수 있는 인터페이스 레퍼런스입니다.

### 🎨 캔버스(Canvas) 기반 노드 에디터
* **출처**: [tldraw](https://tldraw.dev/) / [React Flow](https://reactflow.dev/)
* **분야**: 프론트엔드 캔버스 UI
* **핵심 내용**:
  - 문서를 단순 세로 스크롤이 아닌 노드(Node) 형태로 띄워두고 시각적인 상자(Zone)로 영역을 분할.
  - 전단지나 제품 안내문처럼 '지면의 위치'가 중요한 문서에서 특정 영역(Mask)을 드래그 앤 드롭으로 지정하고 조작하는 인터페이스 설계에 참고.

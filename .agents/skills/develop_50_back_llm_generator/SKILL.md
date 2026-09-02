---
name: develop_50_back_llm_generator
description: "사용자가 백엔드 코어(Native Workflow Engine, Antigravity Agent, 프롬프트 등)의 AI/LLM 파이프라인 개발을 요청할 때 발동합니다. 외부 의존성 배제 및 범용 엔진 원칙을 강제합니다."
---

# LLM & Workflow Engine Development Checklist & Generator

이 스킬은 사용자가 백엔드(`apps/api/app/core`)의 **AI 에이전트 생성, 파이프라인(DAG), 워크플로우 엔진, 프롬프트 엔지니어링** 기능 구현을 지시할 때 발동합니다.
에이전트는 코드 작성을 전후하여 반드시 아래의 **체크리스트**를 스스로 점검하고 결과를 사용자에게 보고해야 합니다.

## 📋 [LLM / Workflow Engine Development Checklist]

### 1. Native Workflow Engine 독립성
- [ ] **외부 의존성 배제:** Dify 클라이언트 등 외부 서비스에 의존하지 않고, 내부 자체적인 DAG(방향성 비순환 그래프) 엔진(`core/workflow`)으로 파이프라인을 구현했는가?
- [ ] **4-Phase 준수:** 파이프라인 설계 시 기획/요구사항 카드에 명시된 다단계(Phase) 실행 흐름(예: 분석 ➔ 추출 ➔ 검증)을 독립적인 노드(Node)들로 쪼개어 구성했는가?

### 2. 범용성 및 도메인 중립성 (Domain Agnosticism)
- [ ] **엔진의 순수성:** `core/workflow/engine.py` 인프라 내부나 `core/antigravity/agent.py` 코어 영역에 '웹소설', '캐릭터' 같은 특정 서비스 도메인 종속 로직을 하드코딩하지 않았는가?
- [ ] **플러그인 구조:** 개별 실행 단계는 `workflow/nodes/`에 독립적인 모듈로 추가하여 조립 가능하도록 유연하게 설계했는가?

### 3. Antigravity SDK 활용 규칙
- [ ] **명시적 컨텍스트:** 에이전트 인스턴스화 시 프롬프트와 컨텍스트(Knowledge, Skill)를 명확히 주입하여 시스템 메시지와 유저 인풋을 관리하고 있는가?

### 4. 순수 백엔드(Non-LLM) 로직과의 통신
- [ ] **경계 준수:** 각 도메인의 라우터(`router.py`)가 갖는 HTTP 입출력 제어 코드가 엔진 내부에 섞이지 않고, 순수하게 파라미터만 전달받아 실행되도록 설계했는가?

### 5. 모노레포 위치 검증
- [ ] **경로 확인:** 워크플로우와 AI 코어 코드가 반드시 `apps/api/app/core/` (또는 지정된 하위 폴더) 내부에 배치되었는가?

---

## 🤖 에이전트 행동 지침 (Agent Prompt)
이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 AI/워크플로우 엔진 구현을 완료했습니다. `develop_50_back_llm_generator` 체크리스트 점검 결과:
> 1. Native 독립성 (통과/위반 사유)
> 2. 도메인 중립성 (통과/위반 사유)
> 3. SDK 활용 (통과/위반 사유)
> 4. 로직 경계 (통과/위반 사유)
> 5. 모노레포 경로 (통과/위반 사유)"

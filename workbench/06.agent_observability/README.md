# [06.agent_observability] Agent Engineering Observability & Runtime Inspector

> **목적**: VibePatchNote의 다단계 복합 Agent 시스템(하이브리드 LLM 런타임: `agy_cli` + Direct API + 로컬 서빙)을 엔지니어링 관점에서 100% 투명하게 관측, 검증, 성능 튜닝하기 위한 전용 인스펙터(Inspector) 작업대입니다.

---

## 1. 개요 및 배경

- **기존의 문제**: 에이전트의 내부 실행 과정(주입된 프롬프트, 첨부된 미디어, 원본 출력 문자열, Bounding Box 좌표 정렬)이 깜깜이(Black Box)로 남아 디버깅 및 성능 튜닝에 극심한 병목이 발생함.
- **기성 툴의 한계**: LangSmith, Phoenix 등 외부 도구는 OS 서브프로세스 CLI(`agy`)와 독자적 서킷 브레이커/폴백 상태 머신을 추적하지 못하며, PDF 기하 시각화 같은 도메인 뷰를 지원하지 않음.
- **해결책**: 모노레포 내부 데이터(`apps/api/data/runs`, `tracer`)를 직접 연결하여 가감 없이 뜯어보는 **순수 View 전용 'Agent Engineering Explorer'** 구축.

---

## 2. 문서 인덱스

1. **[01.requirements.md](./01.requirements.md)**: 요구사항 정의서 (7대 기능 요구사항 및 4단계 이행 계획)
2. **[02.specifications.md](./02.specifications.md)**: 구현 사양서 (LangSmith/LangGraph 벤치마킹 통합 Span 모델, CLI 추적 프로토콜, Fallback 스키마, SSE 이벤트 규격)
3. **[03.data_contracts.md](./03.data_contracts.md)**: 데이터 모델링 및 스키마 명세서 (Pydantic v2 & TypeScript SSOT, Span/Attempt/Snapshot 데이터 계약)
4. **[04.standard_interfaces.md](./04.standard_interfaces.md)**: 표준 인터페이스 명세서 (독립 패키지 `packages/agent-telemetry` 아키텍처, StepCollector, BaseLlmHarness, SSE 프로토콜)
5. **[05.inspector_app_architecture.md](./05.inspector_app_architecture.md)**: 독립 Inspector 앱 아키텍처 및 런타임 규격서 (방안 B: `@vibe/inspector` 독립 터미널 구동 및 Client-to-Host 통신 규격)

---
title: Agent Runtime Architecture
status: candidate
related_feature: F-02
---

# Agent Runtime Architecture

## 후보 방향

도메인 Agent는 `documents/agents/`에 두고, 도메인을 모르는 공통 Run·승인·재시도 기능만 `app/core/agent_runtime/`에 둔다.

## 채택 기준

- `core`는 documents, scaffolds 등의 도메인을 import하지 않는다.
- 일반 CRUD 요청은 Agent Runtime을 거치지 않는다.
- Run 상태는 API 응답과 UI 상태로 전달될 수 있다.

## 검토할 사항

동기 요청으로 시작하고, 실제 중단·재개 요구가 생길 때 별도 Run 저장소와 비동기 워커를 도입한다.

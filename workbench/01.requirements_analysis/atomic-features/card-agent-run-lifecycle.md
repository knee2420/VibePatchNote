---
type: card
title: Agent Run Lifecycle (에이전트 실행 생명주기)
category: Feature / Runtime
status: proposed
related_feature: F-02
---

# 에이전트 실행 생명주기

## 설명

Agent 작업은 runId와 traceId를 가지고 `idle → running → succeeded|failed|waiting` 상태를 거친다. 일반 파일 조회·저장 같은 클래식 서비스 요청은 Agent Run을 만들지 않는다.

## 핵심 가치

복잡한 AI 실행만 관측·재시도·재개의 대상이 되어 Runtime이 모든 백엔드 요청을 삼키지 않는다.

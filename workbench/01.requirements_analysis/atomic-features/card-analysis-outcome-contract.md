---
type: card
title: Analysis Outcome Contract (분석 결과 계약)
category: Feature / Reliability
status: proposed
related_feature: F-02
---

# 분석 결과 계약

## 설명

모든 AI 분석 요청은 `succeeded`, `failed`, `waiting_for_configuration`, `waiting_for_approval` 중 하나의 명시적 상태를 반환한다. 실패에는 안정적인 오류 코드, 재시도 가능 여부, traceId, 필요한 사용자 행동을 포함한다.

## 핵심 가치

HTTP 상태만으로 성공을 추정하지 않으며, 실패가 빈 결과나 기존 결과로 위장되는 것을 막는다.

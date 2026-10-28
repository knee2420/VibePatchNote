---
title: Multi-provider LLM Routing
status: candidate
related_feature: F-02
---

# Multi-provider LLM Routing

## 기본 정책

CLI를 우선 실행한다. `QUOTA_EXHAUSTED`, `AUTH_EXPIRED`, `PROVIDER_UNAVAILABLE`만 Google API 폴백 후보가 된다. 폴백은 요청당 한 번으로 제한한다.

## 검토 기준

- 공급자별 쿼터와 비용 모델
- 타임아웃·취소·재시도 정책
- 동일 Run 아래의 공급자별 trace 연결
- 실패한 CLI를 짧은 시간 반복 호출하지 않는 회로 차단 정책

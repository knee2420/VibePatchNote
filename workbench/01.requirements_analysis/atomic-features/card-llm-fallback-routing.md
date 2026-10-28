---
type: card
title: CLI to Google API Fallback Routing (다중 공급자 폴백)
category: Feature / Reliability
status: proposed
related_feature: F-02
---

# CLI → Google API 폴백 라우팅

## 설명

기본 공급자인 CLI가 쿼터 소진, 인증 만료 또는 공급자 불가 상태일 때만 Google API를 한 번 백업 실행한다. 잘못된 문서, 정책 차단, 입력 검증 실패에는 폴백하지 않는다.

## 핵심 가치

불필요한 이중 비용과 반복 실패를 막으면서 분석 가능성을 높인다.

---
id: F-02
title: Agent Runtime 및 복원력 있는 LLM 실행
spec_version: 0.1.0-draft
status: proposed
updated_at: 2026-09-09
depends_on:
  - F-01
---

# Agent Runtime 및 복원력 있는 LLM 실행

## 목적

AI 문서 분석이 실패했을 때 사용자가 이유, 현재 실행 경로, 다음 행동을 화면에서 이해할 수 있게 한다. 기본 실행 수단은 CLI이며, 쿼터 소진 등 허용된 실패에서는 사용자가 미리 설정한 Google API를 백업 수단으로 사용한다.

## 사용자 가치

- 분석 실패가 빈 결과나 멈춘 화면으로 보이지 않는다.
- 사용자는 API 키를 안전하게 설정하고, 언제 백업 공급자가 사용됐는지 안다.
- 장시간 분석은 실행 식별자와 상태를 가지며, 설정 또는 승인이 필요하면 중단 후 재개할 수 있다.

## 범위

1. 분석 성공·실패·설정 필요 상태를 구조화된 계약으로 반환한다.
2. CLI 우선, Google API 폴백의 명시적 정책을 제공한다.
3. 자격증명 설정·연결 테스트·삭제 UI를 제공한다.
4. Agent Run, traceId, 사용자 승인을 별도 상태로 관리한다.

## 단계적 이행

| 단계 | 상태 | 산출물 |
| --- | --- | --- |
| 0 | 다음 구현 | 아웃라인 실패 계약과 UI 오류 표시 |
| 1 | 계획 | 공통 LLM 실패 분류·traceId 전파 |
| 2 | 계획 | CLI → Google API 폴백과 보안 자격증명 설정 |
| 3 | 계획 | Agent Run·승인 대기·재개 |
| 4 | 계획 | 엔진 ModelExecutor 계약 정리 및 하네스 역전 |

## 연결 카드

- `card-analysis-outcome-contract.md`
- `card-llm-fallback-routing.md`
- `card-google-api-credential-setup.md`
- `card-agent-run-lifecycle.md`
- `card-human-approval-resume.md`

## 변경 이력

### 0.1.0-draft

- CLI 우선 실행, Google API 폴백, Agent Runtime의 초기 목표 구조를 정의했다.

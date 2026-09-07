---
type: index
title: "10-agent-capabilities: 에이전트 고급 역량"
description: "헤드리스 모드, 서브에이전트 오케스트레이션, 실행 모드, 샌드박스 및 권한 보안"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/"
timestamp: "2026-09-07"
---

# 이 섹션은

Antigravity CLI의 **에이전트 고급 역량** 영역을 체계화한 섹션이다.
헤드리스 모드, 서브에이전트 오케스트레이션, 실행 모드, 샌드박스 및 권한 보안에 대한 실전 명세를 제공하며, 개발자와 AI 에이전트가 터미널 환경에서 기능을 확장하고 제어할 때 참조해야 할 표준 카드들을 응집하고 있다.

- 공통 해결 과제: 에이전트 고급 역량 환경에서의 인터페이스 표준화 및 안전한 실행 제약 보장
- 우선 참조 포인트: 각 카드의 elements 목록에 정의된 명령어 구문과 설정 인터페이스 스키마

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [Choose an execution mode](C-01-modes.md) | Choose an execution mode 관련 핵심 인터페이스 및 실행 가이드 | 17 |
| [Headless Mode](C-02-headless.md) | Headless Mode 관련 핵심 인터페이스 및 실행 가이드 | 32 |
| [Background Tasks & Subagents](C-03-subagents.md) | Background Tasks & Subagents 관련 핵심 인터페이스 및 실행 가이드 | 11 |
| [Sandbox](C-04-sandbox.md) | Sandbox 관련 핵심 인터페이스 및 실행 가이드 | 8 |
| [Permissions](C-05-permissions.md) | Permissions 관련 핵심 인터페이스 및 실행 가이드 | 9 |

# 이 섹션 밖

- [루트 인덱스](../index.md)에서 전체 CLI 개요 및 타 섹션과의 결합도 확인 가능
- [에이전트 역량](../10-agent-capabilities/index.md) 섹션과 연계하여 권한 및 샌드박스 정책 필수 대조
- ⚠️ 설정값 변경 시 세션 재시작 및 CLI 캐시 갱신 여부를 반드시 확인할 것

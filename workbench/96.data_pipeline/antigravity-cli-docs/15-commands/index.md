---
type: index
title: "15-commands: 슬래시 커맨드 레퍼런스"
description: "에이전트 제어, 부스팅, 코드검색, 디프, 권한, 협업 등 12대 슬래시 커맨드 전수 스펙"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/"
timestamp: "2026-09-07"
---

# 이 섹션은

Antigravity CLI의 **슬래시 커맨드 레퍼런스** 영역을 체계화한 섹션이다.
에이전트 제어, 부스팅, 코드검색, 디프, 권한, 협업 등 12대 슬래시 커맨드 전수 스펙에 대한 실전 명세를 제공하며, 개발자와 AI 에이전트가 터미널 환경에서 기능을 확장하고 제어할 때 참조해야 할 표준 카드들을 응집하고 있다.

- 공통 해결 과제: 슬래시 커맨드 레퍼런스 환경에서의 인터페이스 표준화 및 안전한 실행 제약 보장
- 우선 참조 포인트: 각 카드의 elements 목록에 정의된 명령어 구문과 설정 인터페이스 스키마

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [Agents Command (/agents)](C-01-agents.md) | Agents Command (/agents) 관련 핵심 인터페이스 및 실행 가이드 | 12 |
| [Boost Command (/boost)](C-02-boost.md) | Boost Command (/boost) 관련 핵심 인터페이스 및 실행 가이드 | 17 |
| [Code Search Command (/codesearch)](C-03-codesearch.md) | Code Search Command (/codesearch) 관련 핵심 인터페이스 및 실행 가이드 | 11 |
| [AI Credits Command (/credits)](C-04-credits.md) | AI Credits Command (/credits) 관련 핵심 인터페이스 및 실행 가이드 | 3 |
| [Diff Command (/diff)](C-05-diff.md) | Diff Command (/diff) 관련 핵심 인터페이스 및 실행 가이드 | 14 |
| [Permissions Command (/permissions)](C-06-permissions.md) | Permissions Command (/permissions) 관련 핵심 인터페이스 및 실행 가이드 | 9 |
| [Resume Command (/resume)](C-07-resume.md) | Resume Command (/resume) 관련 핵심 인터페이스 및 실행 가이드 | 13 |
| [Status Line Command (/statusline)](C-08-statusline.md) | Status Line Command (/statusline) 관련 핵심 인터페이스 및 실행 가이드 | 8 |
| [Teamwork Command (/teamwork-preview)](C-09-teamwork.md) | Teamwork Command (/teamwork-preview) 관련 핵심 인터페이스 및 실행 가이드 | 15 |
| [Window Title Command (/title)](C-10-title.md) | Window Title Command (/title) 관련 핵심 인터페이스 및 실행 가이드 | 3 |
| [Model Quotas (/usage)](C-11-usage.md) | Model Quotas (/usage) 관련 핵심 인터페이스 및 실행 가이드 | 5 |
| [Voice Dictation (/voice)](C-12-voice.md) | Voice Dictation (/voice) 관련 핵심 인터페이스 및 실행 가이드 | 11 |

# 이 섹션 밖

- [루트 인덱스](../index.md)에서 전체 CLI 개요 및 타 섹션과의 결합도 확인 가능
- [에이전트 역량](../10-agent-capabilities/index.md) 섹션과 연계하여 권한 및 샌드박스 정책 필수 대조
- ⚠️ 설정값 변경 시 세션 재시작 및 CLI 캐시 갱신 여부를 반드시 확인할 것

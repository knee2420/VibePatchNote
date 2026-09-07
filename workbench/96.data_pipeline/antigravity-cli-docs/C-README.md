---
type: card
title: "README"
description: "README 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/README.md"
timestamp: "2026-09-07"
---

# summary
README의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
`https://antigravity.google/docs/cli/` 공식 문서를 Markdown으로 스크랩한 사본입니다. 폴더 구조는 공식 문서 사이드바 목차 순서를 그대로 따릅니다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Antigravity CLI 문서 아카이브 (v1.1.25) | `https://antigravity.google/docs/cli/` 공식 문서를 Markdown으로 스크랩한 사본입니다. 폴더 구조는 공식 문서 사이드바 목차 순서를 그대로 따릅니다. | `# Antigravity CLI 문서 아카이브 (v1.1.25)` |
| E2 | 원칙 | 목차 | 목차에 대한 핵심 사양 및 작동 규칙 정의. | `## 목차` |
| E3 | 원칙 | 9. Artifacts | 9. Artifacts에 대한 핵심 사양 및 작동 규칙 정의. | `### 9. Artifacts` |
| E4 | 아키텍처 | 10. Agent Capabilities | 10. Agent Capabilities에 대한 핵심 사양 및 작동 규칙 정의. | `### 10. Agent Capabilities` |
| E5 | 원칙 | 11. Projects | 11. Projects에 대한 핵심 사양 및 작동 규칙 정의. | `### 11. Projects` |
| E6 | 인터페이스 | 12. Settings | 12. Settings에 대한 핵심 사양 및 작동 규칙 정의. | `### 12. Settings` |
| E7 | 원칙 | 13. AI Credits | 13. AI Credits에 대한 핵심 사양 및 작동 규칙 정의. | `### 13. AI Credits` |
| E8 | 원칙 | 14. Customizations | 14. Customizations에 대한 핵심 사양 및 작동 규칙 정의. | `### 14. Customizations` |
| E9 | 도구 | 15. Commands | 15. Commands에 대한 핵심 사양 및 작동 규칙 정의. | `### 15. Commands` |
| E10 | 원칙 | 16–18. 마무리 | --- | `### 16–18. 마무리` |
| E11 | 원칙 | 참고 | - **14.1 MCP** (`/docs/cli/mcp/`)는 Antigravity 전 제품(2.0 / IDE / CLI / SDK)을 아우르는 공통 MCP 가이드로 제공됩니다. CLI 전용 내용은 문서 내 "... | `## 참고` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[README.md](../../99.archive/antigravity-cli-docs/README.md) · [공식 사이트](https://antigravity.google/docs/cli/)

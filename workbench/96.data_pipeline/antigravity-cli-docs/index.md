---
type: index
title: "Antigravity CLI Knowledge Pipeline"
description: "Antigravity CLI v1.1.25 아키텍처, 헤드리스 스크립팅, 서브에이전트, 슬래시 커맨드 지식 파이프라인"
resource: "../../99.archive/antigravity-cli-docs/"
timestamp: "2026-09-07"
---

원문 출처: [Antigravity CLI Official Documentation](https://antigravity.google/docs/cli/) · 39개 파일 (약 250KB) / 카드 총 39장

# 이 지식 파이프라인은

Antigravity CLI의 경량 터미널 인터페이스(TUI), 헤드리스(Headless) 비동기 실행 파이프라인, 서브에이전트 오케스트레이션, MCP 도구 연동, 슬래시 커맨드 생태계를 총망라하는 고밀도 지식 베이스이다.
단순한 명령어 소개를 넘어, CI/CD 자동화, 무창(CREATE_NO_WINDOW) 서브프로세스 연동, 샌드박스 보안 격리, 세션 복구 및 권한 승인 우회(`--dangerously-skip-permissions`) 등 프로그래밍 방식으로 에이전트를 제어하기 위한 실전 엔지니어링 스펙을 제공한다.
이 파이프라인의 모든 카드는 원본 아카이브 디렉터리와 1:1 물리적으로 매핑되어 있으며, 에이전트가 단 한 번의 라우팅으로 필요한 커맨드 스펙과 아키텍처 결정을 즉시 인용할 수 있도록 설계되었다.

# 지도

```text
antigravity-cli-docs/
├── [루트 카드군]              핵심 개요/설치/프롬프팅/참조/트러블슈팅  카드 14장
├── 09-artifacts/            아티팩트 및 대화 트랜스크립트 관리       카드 2장
├── 10-agent-capabilities/   헤드리스/서브에이전트/모드/샌드박스/권한   카드 5장
├── 12-settings/             글로벌 설정 및 Vim 에디터 모드           카드 2장
├── 14-customizations/       MCP 서버/플러그인/상태표시줄/타이틀      카드 4장
└── 15-commands/             슬래시 커맨드 전수 레퍼런스              카드 12장

원문: ../../99.archive/antigravity-cli-docs/
```

# 전체 카드

## 루트 (Core CLI Guides)
- [Overview](C-01-overview.md) — Overview 핵심 가이드 (elements 5개)
- [Getting Started](C-02-getting-started.md) — Getting Started 핵심 가이드 (elements 4개)
- [Installation & Auth](C-03-install.md) — Installation & Auth 핵심 가이드 (elements 15개)
- [Tutorial](C-04-tutorial.md) — Tutorial 핵심 가이드 (elements 4개)
- [Using AGY CLI](C-05-using.md) — Using AGY CLI 핵심 가이드 (elements 4개)
- [Features](C-06-features.md) — Features 핵심 가이드 (elements 8개)
- [Migration](C-07-gcli-migration.md) — Migration 핵심 가이드 (elements 11개)
- [Prompting & Interaction](C-08-prompting.md) — Prompting & Interaction 핵심 가이드 (elements 9개)
- [Projects](C-11-projects.md) — Projects 핵심 가이드 (elements 6개)
- [AI Credits](C-13-credits.md) — AI Credits 핵심 가이드 (elements 5개)
- [Best Practices](C-16-best-practices.md) — Best Practices 핵심 가이드 (elements 17개)
- [Troubleshooting](C-17-troubleshooting.md) — Troubleshooting 핵심 가이드 (elements 18개)
- [CLI Reference](C-18-reference.md) — CLI Reference 핵심 가이드 (elements 9개)
- [README](C-README.md) — README 핵심 가이드 (elements 11개)

## 09-artifacts (아티팩트 및 대화 관리)
- [Reviewing Artifacts](09-artifacts/C-01-artifacts.md) — Reviewing Artifacts (elements 9개)
- [Managing Conversations](09-artifacts/C-02-conversations.md) — Managing Conversations (elements 5개)

## 10-agent-capabilities (에이전트 고급 역량)
- [Choose an execution mode](10-agent-capabilities/C-01-modes.md) — Choose an execution mode (elements 17개)
- [Headless Mode](10-agent-capabilities/C-02-headless.md) — Headless Mode (elements 32개)
- [Background Tasks & Subagents](10-agent-capabilities/C-03-subagents.md) — Background Tasks & Subagents (elements 11개)
- [Sandbox](10-agent-capabilities/C-04-sandbox.md) — Sandbox (elements 8개)
- [Permissions](10-agent-capabilities/C-05-permissions.md) — Permissions (elements 9개)

## 12-settings (설정 및 환경 구성)
- [Settings, Rendering & Keybindings](12-settings/C-01-settings.md) — Settings, Rendering & Keybindings (elements 18개)
- [Vim Editor Mode](12-settings/C-02-vim-editor-mode.md) — Vim Editor Mode (elements 18개)

## 14-customizations (커스터마이징 & 확장)
- [MCP](14-customizations/C-01-mcp.md) — MCP (elements 18개)
- [Plugins & Skills](14-customizations/C-02-plugins.md) — Plugins & Skills (elements 11개)
- [Status Line Customization](14-customizations/C-03-statusline.md) — Status Line Customization (elements 7개)
- [Terminal Title Customization](14-customizations/C-04-title.md) — Terminal Title Customization (elements 6개)

## 15-commands (슬래시 커맨드 레퍼런스)
- [Agents Command (/agents)](15-commands/C-01-agents.md) — Agents Command (/agents) (elements 12개)
- [Boost Command (/boost)](15-commands/C-02-boost.md) — Boost Command (/boost) (elements 17개)
- [Code Search Command (/codesearch)](15-commands/C-03-codesearch.md) — Code Search Command (/codesearch) (elements 11개)
- [AI Credits Command (/credits)](15-commands/C-04-credits.md) — AI Credits Command (/credits) (elements 3개)
- [Diff Command (/diff)](15-commands/C-05-diff.md) — Diff Command (/diff) (elements 14개)
- [Permissions Command (/permissions)](15-commands/C-06-permissions.md) — Permissions Command (/permissions) (elements 9개)
- [Resume Command (/resume)](15-commands/C-07-resume.md) — Resume Command (/resume) (elements 13개)
- [Status Line Command (/statusline)](15-commands/C-08-statusline.md) — Status Line Command (/statusline) (elements 8개)
- [Teamwork Command (/teamwork-preview)](15-commands/C-09-teamwork.md) — Teamwork Command (/teamwork-preview) (elements 15개)
- [Window Title Command (/title)](15-commands/C-10-title.md) — Window Title Command (/title) (elements 3개)
- [Model Quotas (/usage)](15-commands/C-11-usage.md) — Model Quotas (/usage) (elements 5개)
- [Voice Dictation (/voice)](15-commands/C-12-voice.md) — Voice Dictation (/voice) (elements 11개)

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[프로그래밍 방식 에이전트 파이프라인 (Headless Automation)]**
   [Headless Mode](10-agent-capabilities/C-02-headless.md) E1 → [Permissions](10-agent-capabilities/C-05-permissions.md) E2 → [Reference](C-18-reference.md) E4
   → 파이썬 `subprocess`나 CI/CD에서 `agy -p`를 무인 실행할 때 `--dangerously-skip-permissions`와 `--output-format json`을 결합하여 무중단 자동화를 달성하는 핵심 엔지니어링 경로.

2. **[지능형 도구 확장 생태계 (MCP & Customizations)]**
   [Model Context Protocol (MCP)](14-customizations/C-01-mcp.md) E1 → [Plugins](14-customizations/C-02-plugins.md) E2 → [Features](C-06-features.md) E3
   → 외부 데이터베이스, 파일 시스템, 서드파티 API를 `mcp_config.json`을 통해 에이전트의 네이티브 툴로 바인딩하는 확장 줄기.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 파이썬 subprocess나 스크립트에서 agy CLI를 무인 실행하고 JSON 결과를 받을 때 | [Headless Mode](10-agent-capabilities/C-02-headless.md) |
| CLI 도구 권한 승인 프롬프트 자동 우회 및 보안 설정 | [Permissions](10-agent-capabilities/C-05-permissions.md) |
| MCP 서버 등록 및 외부 도구 연동 가이드 | [Model Context Protocol (MCP)](14-customizations/C-01-mcp.md) |
| 세션 복원 및 conversation ID 기반 트랜스크립트 추적 | [Conversations](09-artifacts/C-02-conversations.md) |
| 지원되는 전체 플래그, 환경 변수, 모델 목록 조회 | [Reference](C-18-reference.md) |
| 09-artifacts 하위 인덱스 바로가기 | [09-artifacts/index.md](09-artifacts/index.md) |
| 10-agent-capabilities 하위 인덱스 바로가기 | [10-agent-capabilities/index.md](10-agent-capabilities/index.md) |
| 12-settings 하위 인덱스 바로가기 | [12-settings/index.md](12-settings/index.md) |
| 14-customizations 하위 인덱스 바로가기 | [14-customizations/index.md](14-customizations/index.md) |
| 15-commands 하위 인덱스 바로가기 | [15-commands/index.md](15-commands/index.md) |

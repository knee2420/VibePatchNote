---
type: card
title: "Biome Linter & Formatter Rules"
description: "고속 Rust 기반 Biome 코드 포맷팅 및 린팅 엄격 모드 규칙"
resource: "../../99.archive/kiboui/biome.jsonc"
timestamp: "2026-09-16"
---

# summary
고속 Rust 기반 Biome 코드 포맷팅 및 린팅 엄격 모드 규칙를 다루며, Kibo UI 모노레포의 **핵심 운영 아키텍처 및 품질 규약**을 규정한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | 린터 권장 규칙 활성화 | `linter.rules.recommended: true` 기반 엄격한 품질 표준 적용 | `"linter"` |
| E2 | 규칙 | 포맷터 스타일 규약 | 2스페이스 들여쓰기, 더블 쿼트, 후행 쉼표 등 통일된 서식 규칙 | `"formatter"` |
| E3 | 규칙 | 파일 예외 처리 | .next, dist, node_modules 등 빌드 산출물 검사 배제(ignore) 설정 | `"files"` |

# 밖으로
- [E1] 모노레포 내 상세 가이드는 `[apps/docs/content/docs/C-setup.md](apps/docs/content/docs/C-setup.md)`를 참조한다.
- [E2] 빌드 파이프라인의 구체적인 캐싱 정책은 `[C-turbo.md](C-turbo.md)`에서 선언된다.

# 원문
[biome.jsonc](../../99.archive/kiboui/biome.jsonc) · [kibo-ui.com](https://www.kibo-ui.com)

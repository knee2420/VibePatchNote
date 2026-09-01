---
type: card
title: "FSD Public API와 슬라이스 격리 (public-api)"
description: "각 슬라이스의 index.ts를 통해서만 외부에 노출하고 내부 구현을 은닉하는 캡슐화 규칙"
resource: "../../../99.archive/feature-sliced-design/src/content/docs/docs/reference/public-api.mdx"
timestamp: "2026-09-01"
---

# summary
슬라이스 내부의 세부 컴포넌트나 헬퍼 함수를 외부에서 직접 임포트하지 못하도록, **오직 최상위 `index.ts`만을 진입점(Public API)으로 강제**하여 결합도를 낮추고 모듈 독립성을 보장하는 방법론을 다룬다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | Public API 강제 | 슬라이스 외부에서는 오직 `index.ts`에 정의된 심볼만 import 허용 | `## Public API Definition` |
| E2 | 안티패턴 | 심층 임포트 차단 | `import ... from '@/features/auth/ui/Button'` 형태의 내부 파일 직접 참조 금지 | `## Deep Imports Anti-pattern` |
| E3 | 구조 | 슬라이스 캡슐화 | 외부에서 알 필요 없는 내부 헬퍼/상태를 비공개로 유지하여 모듈성 확보 | `## Encapsulation Benefits` |
| E4 | 코드 | index.ts 템플릿 | `export { AuthForm } from './ui/AuthForm'` 형태의 명시적 재export 구조 | `## Standard Index Template` |
| E5 | 절차 | 리팩토링 격리 | 내부 파일 구조가 변경되어도 Public API만 유지되면 전체 앱에 무영향 | `## Refactoring Isolation` |
| E6 | 규칙 | 교차 참조 금지 | 동일 레이어의 다른 슬라이스를 Public API로도 참조 불가 | `## Cross-Slice Imports Rule` |

# 밖으로
- [E1, E2] 규칙은 `[C-layers](C-layers.md)`의 상하위 계층 규칙과 결합하여 전체 프로젝트의 결합도를 제로화한다.
- [E6] 규칙은 상위 레이어(`pages` 또는 `app`)에서 두 슬라이스를 조합(Composition)함으로써 해결한다.

# 원문
[FSD Public API 원본](../../../99.archive/feature-sliced-design/src/content/docs/docs/reference/public-api.mdx) · [공식 사이트](https://feature-sliced.design/docs/reference/public-api)

# @vibe/web

VibePatchNote 프론트엔드. **FSD(Feature-Sliced Design)** 레이어를 따릅니다.

## 레이어

`app` ➔ `pages` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`

| 레이어 | 역할 |
| --- | --- |
| `app` | 진입점, 전역 Provider, 라우팅, 글로벌 스타일 |
| `pages` | 라우트 단위 화면. widgets/features 조합만 담당 |
| `widgets` | 여러 feature/entity 를 묶은 독립 UI 블록 |
| `features` | 사용자 동작 단위 비즈니스 로직 (`ui`/`model`/`api`) |
| `entities` | 도메인 객체 + 기본 노드 뷰 |
| `shared` | `api`(httpClient) / `config`(env) / `lib` / `model` / `ui` |

## 규칙

1. **하위 → 상위 import 금지.** entities 가 features 를 참조할 수 없습니다.
2. **동일 레이어 cross-import 금지.** `features/A` 는 `features/B` 를 참조할 수 없습니다.
3. **Public API 경유.** `@/features/workspace` 는 되지만 `@/features/workspace/ui/...` 는 금지입니다.
4. **백엔드 호출은 `shared/api` 의 `httpClient` 만.** 호스트 하드코딩 금지.

위 규칙은 `.oxlintrc.json` 이 린트 에러로 차단합니다.

## 명령어

```bash
pnpm dev
```

```bash
pnpm typecheck
```

```bash
pnpm lint
```

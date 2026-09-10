---
trigger: always_on
---

# Workflow & Collaboration Principles

## 원칙

### 1. 아이데이션 및 대화 우선 (No Unauthorized Code/Plan)

- 사용자가 명시적으로 코드 작성이나 Plan/Task 생성을 지시하기 전까지는 독단적으로 코드를 작성하거나 수정을 진행하지 않습니다.
- 설계, 기획, 아키텍처 결정을 충분히 상의하고 합의한 뒤 실행 단계로 진입합니다.

### 2. 검증은 터미널이 기본, 브라우저는 예외

검증의 정본은 [`00-core/rule.md` §6](../00-core/rule.md) 입니다. 그 게이트를 **먼저, 전부** 돌립니다.

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @vibe/api test
```

백엔드 동작은 앱 임포트(`python -c "import main"`)와 **엔드포인트 실호출**로 확인합니다.
여기까지가 기본이며, 대부분의 변경은 여기서 끝납니다.

**브라우저를 띄우는 것은 아래를 모두 만족할 때만입니다.**

| 조건 | 설명 |
| --- | --- |
| 터미널로 검증 불가능 | 화면 렌더링·캔버스 상호작용·노드 표시처럼 HTTP 응답만으로는 확인이 안 되는 변경 |
| 사용자가 실행 확인을 요구 | "실제로 동작하는지 확인해줘" 같은 명시적 지시 |
| 목적이 한정 | 확인할 것을 미리 정하고, 확인되면 즉시 종료 |

브라우저를 **탐색용으로 띄우지 않습니다.** 화면을 이리저리 눌러 보며 상태를 파악하는 것은
토큰 낭비이며, 그 정보는 대개 코드와 네트워크 로그로 더 정확하게 얻을 수 있습니다.

> 왜 예외를 두는가: `00-core` §6은 "동작 변경은 실행으로 검증한다. 빌드 통과는 동작 검증이 아니다"
> 라고 못 박습니다. UI 변경에서 이 요구를 만족시킬 유일한 수단이 브라우저인 경우가 있고,
> 그때 검증을 건너뛰면 헌법을 어기게 됩니다. 두 규칙의 충돌은 **"터미널 우선, 브라우저는
> 목적이 한정된 최후 수단"** 으로 정리합니다.

### 3. 주력 모델 기준 준수

모델 이름은 **두 네임스페이스**로 갈립니다. 섞지 마십시오.

| 네임스페이스 | 정본 | 현재 값 |
| --- | --- | --- |
| **에이전트 CLI** (`agy`) | `packages/scaffold-engine/scaffold_engine/harness/registry.py` | `gemini-3.8-flash-{low,medium,high}`<br>`gemini-3.7-flash-*` · `gemini-3.6-flash-*`<br>`gemini-3.1-pro-*` · `gemma4-31b` |
| **Google API 직결** (폴백) | Google 공개 모델명 | `gemini-2.5-flash` |

- 기본값은 `apps/api/app/core/config.py` 의 `_DEFAULT_AGENT_CLI_MODEL`(현재 `gemini-3.8-flash-low`)과
  `_DEFAULT_GOOGLE_API_MODEL`(현재 `gemini-2.5-flash`)입니다.
- **레지스트리에 없는 CLI 모델명을 코드나 문서에 쓰지 마십시오.** 실행 시점에 실패합니다.
  새 모델을 쓰려면 먼저 `registry.py` 에 `ModelSpec` 을 등록합니다.
- Google API 직결 모델은 CLI 레지스트리와 무관합니다. 두 목록을 한 문장에 섞어 적으면
  "구형 모델 금지" 같은 규칙이 폴백 경로를 잘못 막습니다.

> 📌 미결: Google 직결 폴백을 `gemini-2.5-flash` 로 유지할지, 상위 모델로 올릴지는
> 비용·품질 판단이 필요합니다. 바꾸려면 `_DEFAULT_GOOGLE_API_MODEL` 하나만 고치면 됩니다.

### 4. 외부 패키지 도입

[`30-workflow/package-curation.md`](./package-curation.md) 를 따릅니다. 사전 승인 없이 설치하지 않습니다.

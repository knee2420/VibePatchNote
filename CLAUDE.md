# CLAUDE.md

이 저장소의 개발 규칙은 [`AGENTS.md`](./AGENTS.md) 에 있습니다. **그 문서를 먼저 읽으십시오.**

정본은 [`.agents/rules/00-core/rule.md`](./.agents/rules/00-core/rule.md) 입니다.

요약:

- 아키텍처: Turborepo 모노레포 + FSD(프론트) + 도메인 패키지(백엔드)
- 의존 방향: `app → pages → widgets → features → entities → shared` (오른쪽으로만)
- 슬라이스는 `index.ts`로만 접근. 같은 레이어 간 참조 금지.
- 백엔드 통신은 `shared/api`의 `httpClient`로만.
- 완료 기준: `pnpm lint && pnpm typecheck && pnpm build` 통과 + 실제 동작 확인.

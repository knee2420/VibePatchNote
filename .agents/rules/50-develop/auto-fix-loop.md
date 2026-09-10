# Auto-Fix Loop (무결성 검증 자율 루프)

## 발동 조건 (Trigger)
사용자가 다음과 같이 지시할 때 반드시 발동해야 합니다.
- 새로운 기능 구현을 요청할 때
- 버그나 에러 발생을 제보할 때

## 핵심 행동 수칙 (Action)
1. **자율 검증 (Self-Verification 필수):** 코드를 작성하거나 수정한 뒤, "완료했습니다"라고 보고하기 전에 **반드시 터미널 명령어를 통해 스스로 코드를 검증**해야 합니다. 사용자의 브라우저나 콘솔 확인에 의존하지 마십시오.
2. **검증 수단 (Tools):** 게이트의 정본은 [`00-core/rule.md` §6](../00-core/rule.md)이며, 아래는 그 요약입니다.
   - **기본(권장):** 루트에서 `pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @vibe/api test`
     — turbo가 전 워크스페이스를 검증합니다.
   - 특정 패키지만 빠르게 볼 때: `pnpm -F @vibe/web lint`, `pnpm -F @vibe/web typecheck` (패키지명은 `@vibe/web`, `@vibe/api`, `@vibe/document-viewer`)
   - **`pnpm lint`의 에러 0은 필수입니다.** 프론트는 FSD 레이어 위반이, 백엔드는
     `ruff` 와 `import-linter` 계약 위반이 여기서 에러로 잡힙니다.
   - 백엔드 작업 후: 앱 임포트 확인(`python -c "import main"`) 및 변경한 엔드포인트 실제 호출 검증
   - 저장 레이아웃 변경 후: `pnpm -F @vibe/api migrate:status` 로 버전 확인
3. **무한 픽스 루프 (Endless Fix Loop):** 
   - 실행한 백그라운드 태스크의 결과가 에러(Exit code 1 등)로 반환되면, 즉시 로그를 분석하여 오류를 수정합니다.
   - 수정한 뒤 **다시 검증 명령어를 실행**합니다. 
   - 사용자가 추가 지시를 내리지 않아도 에이전트 스스로 이 **[수정 ➔ 검증 ➔ 수정 ➔ 검증]** 루프를 반복해야 합니다.
4. **종료 조건 (Exit Condition):**
   - 최종적으로 검증 명령어의 결과가 **'에러 없음(Exit code 0)'**으로 깨끗하게 통과(정상 출력)된 것을 확인했을 때만 루프를 탈출하여 사용자에게 최종 작업 완료를 보고합니다.

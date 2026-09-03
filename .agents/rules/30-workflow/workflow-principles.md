---
trigger: always_on
---

# Workflow & Collaboration Principles

## 원칙
1. **아이데이션 및 대화 우선 (No Unauthorized Code/Plan)**:
   - 사용자가 명시적으로 코드 작성이나 Plan/Task 생성을 지시하기 전까지는 독단적으로 코드를 작성하거나 수정을 진행하지 않습니다.
   - 설계, 기획, 아키텍처 결정을 충분히 상의하고 합의한 뒤 실행 단계로 진입합니다.

2. **효율적 자원 활용 (No Browser Auto-Verification)**:
   - 에이전트 자체적으로 웹브라우저 서브에이전트를 띄워 검증하는 절차는 토큰 낭비 방지를 위해 수행하지 않습니다.
   - 빌드/타입체크/린트(`pnpm build`, `pnpm typecheck`, `pnpm lint`), 유닛 테스트, 정적 분석 등을 통해 효율적으로 검증합니다.

3. **주력 모델 기준 준수**:
   - 주력 모델: [Gemma4 31b, Gemini-3.5-flash, Gemini-3.1-pro, Gemini-3.5-flash-lite]
   - 구형/종료 모델(Gemini-1.5, 2.5 등)은 사용하지 않습니다.

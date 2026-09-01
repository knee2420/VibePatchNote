# ShadCN UI First Component Creation

## 원칙
1. **기존 컴포넌트 우선 확인**:
   - 새로운 UI 컴포넌트가 필요할 때, 먼저 `frontend/src/components/ui/`에 이미 설치되어 있는 컴포넌트(Button, Card, Input, Badge 등)가 있는지 확인합니다.

2. **ShadCN 공식 레지스트리 우선 고려**:
   - 기존 설치 항목에 없다면 처음부터 새로 만들지 않고, ShadCN 공식 컴포넌트 목록에 존재하는지 확인합니다.
   - 존재하는 경우 `npx shadcn@latest add [컴포넌트명]`을 통해 추가한 후 사용하는 것을 최우선 원칙으로 삼습니다.

3. **컴포넌트 합성 (Composition)**:
   - 프로젝트 고유의 복합 UI가 필요한 경우, ShadCN 원자(Atomic) 컴포넌트들을 조합(Composition)하여 최소 단위 컴포넌트로 분할 제작합니다.
   - 바닥부터 직접 CSS를 작성하는 순수 HTML 태그 대신 가능한 ShadCN 컴포넌트와 Tailwind CSS 유틸리티를 기반으로 작성합니다.

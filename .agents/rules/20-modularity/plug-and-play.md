# Plug & Play Portability

## 원칙
1. **외부 프로젝트 즉시 이식 가능성**:
   - `components/ui/` 및 `components/shared/`에 위치한 컴포넌트들은 프로젝트 전역 상태나 특정 백엔드에 종속되지 않는 범용(Stand-alone) 구조로 작성합니다.
   - 다른 React 프로젝트로 해당 컴포넌트 파일만 복사하더라도 Props만 전달하면 즉시 동작해야 합니다.

2. **명확한 진입점 (`index.ts`)**:
   - 각 Feature 모듈은 최상위 `index.ts`를 통해 외부로 노출할 컴포넌트나 훅만 명시적으로 export합니다.
   - 외부에서는 내부 서브 디렉토리를 깊게 참조하지 않고 `index.ts`를 통해서만 모듈을 임포트합니다.

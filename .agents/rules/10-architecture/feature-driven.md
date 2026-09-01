# Feature-Driven Vertical Slice Architecture

## 원칙
1. **기능(Feature) 단위 격리**:
   - 프론트엔드와 백엔드 모두 기술 계층(Layer) 중심이 아닌 **기능(Feature) 중심**으로 디렉토리를 분할합니다.
   - 하나의 기능 폴더 안에 해당 기능 수행에 필요한 컴포넌트, 훅, API 통신 함수, 타입 정의가 모두 응집되어야 합니다.

2. **독립성 및 결합도 최소화**:
   - `features/A`는 `features/B`의 내부 파일에 직접 의존하지 않습니다.
   - 기능 간 데이터 공유가 필요할 경우 최상위 조립 계층(`App` 또는 `Pages`)이나 공통 인터페이스(`types`)를 통합니다.
   - 특정 기능 폴더 전체를 삭제하거나 비활성화해도 다른 기능 및 앱 전체 빌드에 영향이 없어야 합니다.

3. **백엔드 매핑**:
   - 프론트엔드의 `features/[feature_name]`에 대응하여 백엔드도 `features/[feature_name]` 구조로 `router.py`, `service.py`, `schemas.py`를 격리하여 관리합니다.

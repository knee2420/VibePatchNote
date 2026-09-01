# 글로벌 표준 아키텍처 & 엔지니어링 베스트 프랙티스 레퍼런스

프로젝트 설계, 컴포넌트 세분화, 히스토리 관리 및 바이브 코딩(AI 페어 프로그래밍)에 참고할 수 있는 핵심 글로벌 표준 레퍼런스 모음입니다.

---

## 1. 프론트엔드 & 백엔드 모듈 아키텍처

### 🌐 Bulletproof React
* **출처**: [GitHub - alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) (25k+ Stars)
* **분야**: React 엔터프라이즈 아키텍처 표준
* **핵심 내용**:
  - **Feature-Driven 구조**: 기능(Feature) 단위로 폴더를 쪼개고, 그 안에 컴포넌트, 훅, API, 타입을 응집시킴.
  - **Colocation 원칙**: 코드는 그것을 사용하는 가장 가까운 곳에 위치시키고, 2곳 이상 중복될 때만 `shared/`로 승격.
  - **Index Export**: 외부 노출은 `index.ts`를 통해서만 명시적으로 export.

### 🌐 Feature-Sliced Design (FSD)
* **출처**: [feature-sliced.design](https://feature-sliced.design/)
* **분야**: 대규모 프론트엔드 모듈 아키텍처 방법론
* **핵심 내용**:
  - **계층화(Hierarchy)**: `app` > `pages` > `widgets` > `features` > `entities` > `shared`로 엄격히 레이어 분리.
  - **단방향 의존성**: 상위 레이어는 하위 레이어를 알지만, 하위 레이어는 상위 레이어를 절대 알지 못하게 하여 결합도 제로화.

### 🌐 FastAPI Best Practices
* **출처**: [GitHub - zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) (15k+ Stars)
* **분야**: 파이썬 FastAPI 프로덕션 아키텍처
* **핵심 내용**:
  - Router, Service, Schema(Pydantic)의 명확한 역할 분리.
  - 일관된 예외 처리(Global Exception Handler) 및 비동기 엔드포인트 최적화.

---

## 2. 의사결정 & 히스토리/버전 관리

### 📜 ADR (Architecture Decision Records)
* **출처**: [adr.github.io](https://adr.github.io/) / [ThoughtWorks Technology Radar](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
* **분야**: 아키텍처 의사결정 아카이빙
* **핵심 내용**:
  - 중요한 기술/구조 선택 이유를 마크다운 1장으로 기록 (`Context` ➔ `Decision` ➔ `Consequences`).
  - 과거의 결정 맥락을 보존하여 팀원 및 AI가 일관된 설계 방향을 유지하도록 도움.

### 📜 Keep a Changelog
* **출처**: [keepachangelog.com](https://keepachangelog.com/ko/1.0.0/)
* **분야**: 변경 내역 / 패치노트 작성 표준
* **핵심 내용**:
  - 사람이 읽기 좋은 패치노트 6대 표준 분류: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

### 📜 Semantic Versioning (SemVer 2.0.0)
* **출처**: [semver.org](https://semver.org/lang/ko/)
* **분야**: 버전 명명 규칙
* **핵심 내용**: `MAJOR.MINOR.PATCH` (예: 1.0.0)
  - `MAJOR`: 기존 호환성이 깨지는 변경
  - `MINOR`: 하위 호환성을 유지하는 기능 추가
  - `PATCH`: 하위 호환성을 유지하는 버그 수정

---

## 3. 코드 스타일 & 커밋 컨벤션

### 🏷️ Conventional Commits
* **출처**: [conventionalcommits.org](https://www.conventionalcommits.org/ko/v1.0.0/)
* **분야**: Git 커밋 메시지 글로벌 표준
* **핵심 내용**:
  - `feat`: 새 기능 추가
  - `fix`: 버그 수정
  - `refactor`: 구조 개선
  - `style`: 포맷팅/CSS
  - `docs`: 문서/룰 수정
  - `chore`: 빌드/패키지 설정

### 🏷️ Google TypeScript Style Guide & Airbnb JavaScript Guide
* **출처**: [Google TS Style Guide](https://google.github.io/styleguide/tsguide.html) / [Airbnb JS Guide](https://github.com/airbnb/javascript)
* **분야**: 네이밍 및 코드 퀄리티
* **핵심 내용**: 명확한 네이밍(PascalCase 컴포넌트, camelCase 훅, kebab-case 폴더/유틸) 및 불변성 유지.

---

## 4. AI & 바이브 코딩 (AI-Native) 가이드

### 🤖 Awesome CursorRules / Agent Rules
* **출처**: [cursorlist.com](https://cursorlist.com/) / [awesome-cursorrules (GitHub)](https://github.com/PatrickJS/awesome-cursorrules)
* **분야**: AI 시스템 프롬프트 및 프로젝트 룰 템플릿
* **핵심 내용**:
  - AI가 프로젝트 구조를 이탈하지 않도록 가드레일을 치는 실전 프롬프트/룰 패턴 모음.

### 🤖 AHA Programming (Avoid Hasty Abstractions)
* **출처**: [Kent C. Dodds Blog](https://kentcdodds.com/blog/aha-programming)
* **분야**: 컴포넌트 쪼개기 및 추상화 철학
* **핵심 내용**:
  - 섣부른 공통화(DRY 원칙 남용)는 오히려 결합도를 높임.
  - 실제로 2~3회 중복이 발생하기 전까지는 각 모듈에 독립적으로 두고, 명확한 필요가 있을 때만 추상화/승격 진행.



========== 추가 업데이트 ===========

## 1. 모노레포 및 Headless 플러그인 아키텍처

### 🌐 Turborepo (Monorepo Standard)
* **출처**: [turbo.build](https://turbo.build/)
* **분야**: TS/JS 풀스택 모노레포 아키텍처
* **핵심 내용**:
  - `apps/` (실제 구동되는 서비스)와 `packages/` (공통 UI, 유틸, ESLint 설정 등)로 관심사 분리.
  - 헤드리스(Headless) 코어나 플러그인 모듈을 `packages/` 패키지로 독립시켜, 여러 앱에서 재사용 가능하게 구성.
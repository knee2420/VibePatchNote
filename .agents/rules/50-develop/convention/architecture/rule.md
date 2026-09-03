---
description: "전체 프로젝트 아키텍처 및 개발 아웃라인, 공통 컨벤션 원칙"
---

# 🏗 Architecture & Core Principles

이 문서는 `96.data_pipeline` 지식 카드들을 인용하여, 프로젝트 전체를 관통하는 아키텍처 원칙과 개발 아웃라인(틀)을 정의합니다. 모든 에이전트는 코드를 작성하기 전 이 뼈대를 반드시 준수해야 합니다.

## 1. 아키텍처 기반: 모노레포 (Turborepo)
* **원칙:** 기능의 재사용성을 극대화하고 서비스 간 결합도를 낮추기 위해 **Turborepo 기반의 모노레포 아키텍처**를 강제합니다.
* **구조 (개발 아웃라인 틀):**
  - `apps/web`: 프론트엔드 애플리케이션 (React 19, Vite, Tailwind v4, React Flow)
  - `apps/api`: 백엔드 애플리케이션 (FastAPI)
  - `packages/document-viewer`: **호스트 비의존적 범용 문서 뷰어 및 플러그인 엔진 (`@vibe/document-viewer`)** (PDF 가로/세로 스프레드 뷰어, 전략 패턴 레지스트리)
  - `packages/ui`: 공통 UI 디자인 시스템 컴포넌트 패키지 (향후 분리 시)
  - `packages/config`: TypeScript 등 공통 환경 설정 패키지 (`@vibe/config` — `tsconfig/base.json`, `react-app.json`, `react-library.json`)
* **인용:** [Turborepo - The monorepo solution](../../../../../workbench/96.data_pipeline/turborepo/03_the_monorepo_solution/C-03_the_monorepo_solution.md)

## 2. 공통 커밋 컨벤션 (Conventional Commits)
* **원칙:** 기계와 사람이 모두 읽기 쉽도록 일관된 커밋 메시지 룰을 적용합니다.
* **포맷:** `type(scope): subject` 형식 준수 (`feat`, `fix`, `chore`, `docs`, `refactor` 등)
* **인용:** [Conventional Commits](../../../../../workbench/96.data_pipeline/conventional-commits/C-conventional-commits.md)

## 3. 개발 아웃라인 (Development Workflow)
1. **분석 (Map):** 요구사항 카드를 읽고 목표 아키텍처(FSD, 모노레포 등)에 부합하는지 1차 판단.
2. **라우팅 (Route):** 구현에 필요한 기존 규약 문서(`96.data_pipeline`, `98.collection`)를 식별.
3. **학습 (Fetch):** 에이전트 스스로 기존 코드를 유추하기 전, 지정된 지식 카드를 꼼꼼히 열람.
4. **구현 (Synthesis):** 모노레포 구조(`apps/`, `packages/`)와 각 파트(Front/Back)의 규칙(Rule)에 맞춰 정확한 위치에 코드 작성.

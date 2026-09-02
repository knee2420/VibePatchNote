---
description: "백엔드 아키텍처 및 네이티브 파이프라인 컨벤션"
---

# ⚙️ Backend Principles (apps/api)

이 문서는 백엔드(`apps/api`) 서버 개발 시 지켜야 할 아키텍처 및 철학을 정의합니다.

## 1. Native Workflow Engine 독립성
* **원칙:** 백엔드 아키텍처 사상은 Dify(`96.data_pipeline/dify`)의 4-phase 실행 모델을 참고하되, 외부 Dify 클라이언트 의존성을 완벽히 배제하고 **독립적인 Native Pipeline(내부 워크플로우 엔진)**으로 구축합니다.
* **적용 가이드:**
  - `app/core/workflow/engine.py` 등 내부 엔진 골격을 활용하여 DAG(Directed Acyclic Graph) 실행 패턴을 직접 구현합니다.
  - "Dify를 도배하지 마라"는 규칙을 준수하여 시스템을 스탠드얼론(Standalone)으로 유지합니다.

## 2. 도메인 주도 설계 (Domain-Driven Design) 기반 구조
* **원칙:** 백엔드의 디렉토리 구조는 기능(Domain) 단위 패키지로 분할되어야 합니다. 파일 타입(`routes`, `schemas`, `services`)별로 그룹화하는 구조는 지양합니다.
* **계층 구조:**
  - 각 도메인 패키지 (예: `app/workspaces/`, `app/documents/`) 내부에 해당 도메인의 로직을 응집시킵니다.
  - 패키지 내부 구성:
    - `router.py`: 엔드포인트 및 HTTP 요청/응답 처리 로직만 담당. 비즈니스 로직을 직접 수행하지 않고 `service.py`로 위임합니다.
    - `schemas.py`: 해당 도메인의 Pydantic 기반 데이터 검증 및 직렬화/역직렬화 담당. DB 모델과 분리.
    - `service.py`: 도메인의 핵심 비즈니스 로직 전담.

## 3. 에러 핸들링 및 로깅
* **원칙:** 사용자나 시스템 디버깅을 위해 명확한 HTTP Status Code와 상세 에러 메시지를 반환해야 합니다.
* **적용 가이드:** FastAPI의 `HTTPException`을 활용하며, 외부 API 연동 시 예외 처리를 꼼꼼히 감싸서 로컬 서버가 다운되지 않도록 방어합니다.

## 4. 디렉터리 레이어별 상세 컨벤션 (Directory Breakdown)

### 4.1 도메인 패키지 내부 컨벤션
- **`router.py`**: FastAPI의 라우터(APIRouter)가 위치하며, 클라이언트의 HTTP 요청을 받고 응답을 반환합니다. 데이터베이스 조회나 무거운 추출 로직을 직접 수행하지 않고 `service.py`로 위임합니다.
- **`schemas.py`**: Pydantic 모델을 사용해 HTTP 요청 및 응답 데이터의 유효성 검증을 정의합니다.
- **`service.py`**: 비즈니스 로직의 핵심이며, 라우터에서 전달받은 파라미터를 기반으로 워크플로우 엔진을 호출하거나 데이터를 가공합니다.

### 4.2 `app/core` (시스템 코어 및 네이티브 파이프라인)
- **역할:** 비즈니스 도메인과 독립적인 시스템 인프라 로직, 전역 설정(Config) 및 AI 워크플로우/에이전트의 심장부가 위치합니다.
- **세부 디렉터리 분해:**
  - `core/antigravity/`: Antigravity SDK 기반의 에이전트 생성 및 프롬프트 템플릿 관리 등 AI 통신의 최하단 뼈대를 담당합니다. (예: `agent.py`)
  - `core/workflow/`: 외부 Dify 클라이언트를 대체하는 **Native Workflow Engine**의 근간입니다. DAG(방향성 비순환 그래프) 기반으로 실행 노드를 엮어줍니다.
    - `core/workflow/engine.py`: 전체 파이프라인의 4-phase 실행 흐름을 통제하고 전역 상태를 관리하는 메인 오케스트레이터입니다.
    - `core/workflow/nodes/`: 워크플로우 엔진에 플러그인(Plug-in)처럼 결합될 개별 실행 단위(Action Node)들이 정의되는 공간입니다.
- **규칙:** 특정 도메인(예: 웹소설 특정 기능)의 종속적인 비즈니스 로직을 `core` 하위에 직접 작성하지 마십시오. 범용적으로 재사용 가능한 파이프라인 엔진과 인프라 코드만 허용됩니다.

### 4.3 `app/models.py` (전역 모델)
- **역할:** 여러 도메인에서 공통으로 사용되는 Pydantic 글로벌 모델이나 전역 스키마가 위치합니다.

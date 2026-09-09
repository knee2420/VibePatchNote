"""DI 컨테이너와 FastAPI 연결이 깨지지 않았는지 확인하는 smoke tests."""
from __future__ import annotations

from dependency_injector import providers
from fastapi.testclient import TestClient

import main


class FakeHarness:
    """외부 CLI를 실행하지 않는 최소 LLM 하네스."""

    model = "test-model"

    def run_json(self, prompt: str, *, list_key: str) -> dict[str, list[object]]:
        return {"segments": []}


class FakeExtractionService:
    """라우터 검증용 문서 유스케이스 대역. 파일 시스템에는 쓰지 않는다."""

    async def register_upload(self, _filename: str, _content: bytes) -> dict[str, str]:
        return {
            "status": "processing",
            "job_id": "test-job",
            "message": "accepted",
            "filename": "reference.pdf",
        }


class FakeDocumentAnalysisRepository:
    """로컬 파일 시스템에 접근하지 않는 분석 결과 저장소 대역."""

    def outline_exists(self, _filename: str) -> bool:
        return False

    def load_outline(self, _filename: str) -> dict[str, object] | None:
        return None

    def save_outline(self, _filename: str, _document: object) -> None:
        pass

    def load_segment_scan(self, _filename: str) -> dict[str, object] | None:
        return None

    def save_segment_scan(self, _filename: str, _payload: dict[str, object]) -> None:
        pass


class FakeDocumentSourceRepository:
    """원본 파일 I/O 없이 주입 경계만 검증하는 대역."""

    def save(self, _filename: str, _content: bytes) -> object:
        raise AssertionError("This fake is not used by this test")

    def resolve(self, _filename: str) -> object:
        raise AssertionError("This fake is not used by this test")


class FakeSegmentScanner:
    """레거시 워크플로우를 실행하지 않는 세그먼트 분석 포트 대역."""

    async def scan(self, _prompt: str) -> dict[str, object]:
        return {"segments": []}


class FakeScaffoldArchiveService:
    """전역 싱글턴 대신 컨테이너 주입이 사용되는지 확인하는 대역."""

    def get_archive(self, _scaffold_id: str) -> None:
        return None


class FakeWorkspaceService:
    """워크스페이스 라우터 DI 검증용 대역."""

    def get_all_workspaces(self) -> list[dict[str, object]]:
        return []


def test_extraction_service_shares_one_harness_with_workflow() -> None:
    """문서 서비스와 워크플로우 노드는 같은 주입 하네스를 사용해야 한다."""
    fake_harness = FakeHarness()
    fake_repository = FakeDocumentAnalysisRepository()
    fake_source = FakeDocumentSourceRepository()
    fake_scanner = FakeSegmentScanner()

    with (
        main.container.llm_harness.override(providers.Object(fake_harness)),
        main.container.document_analysis_repository.override(providers.Object(fake_repository)),
        main.container.document_source_repository.override(providers.Object(fake_source)),
        main.container.segment_scanner.override(providers.Object(fake_scanner)),
    ):
        service = main.container.extraction_service()
        json_runner = main.container.json_prompt_runner()

    assert service._llm_harness is fake_harness
    assert json_runner._harness is fake_harness
    assert service._document_analysis is fake_repository
    assert service._document_source is fake_source
    assert service._segment_scanner is fake_scanner


def test_documents_upload_route_resolves_injected_service() -> None:
    """HTTP 어댑터가 전역 서비스 없이 컨테이너 서비스로 호출되는지 확인한다."""
    with main.container.extraction_service.override(providers.Object(FakeExtractionService())):
        with TestClient(main.app) as client:
            response = client.post(
                "/api/v1/documents/upload",
                files={"file": ("reference.pdf", b"test-pdf", "application/pdf")},
            )

    assert response.status_code == 200
    assert response.json()["job_id"] == "test-job"


def test_scaffolds_route_resolves_injected_service() -> None:
    """scaffolds 라우터도 전역 서비스 없이 컨테이너를 통해 호출한다."""
    fake_service = FakeScaffoldArchiveService()

    with main.container.scaffold_archive_service.override(providers.Object(fake_service)):
        with TestClient(main.app) as client:
            response = client.get("/api/v1/scaffolds/missing")

    assert response.status_code == 404


def test_workspaces_route_resolves_injected_service() -> None:
    """workspaces 라우터도 로컬 JSON 전역 함수 없이 서비스를 주입받는다."""
    with main.container.workspace_service.override(providers.Object(FakeWorkspaceService())):
        with TestClient(main.app) as client:
            response = client.get("/api/v1/workspaces")

    assert response.status_code == 200
    assert response.json() == []

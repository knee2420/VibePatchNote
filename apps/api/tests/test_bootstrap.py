"""DI 컨테이너와 FastAPI 연결이 깨지지 않았는지 확인하는 smoke tests."""
from __future__ import annotations

from dependency_injector import providers
from fastapi.testclient import TestClient

import main
from app.documents.models import DocumentMeta


class FakeHarness:
    """외부 CLI를 실행하지 않는 최소 LLM 하네스."""

    model = "test-model"

    def run_json(self, prompt: str, *, list_key: str) -> dict[str, list[object]]:
        return {"segments": []}


class FakeDocumentService:
    """라우터 검증용 문서 서비스 대역. 파일 시스템에는 쓰지 않는다."""

    def register_upload(self, _filename: str, _content: bytes) -> DocumentMeta:
        return DocumentMeta(
            doc_id="doc-test",
            original_name="reference.pdf",
            stored_name="source.pdf",
            sha256="0" * 64,
            mime="application/pdf",
            size=8,
        )


class FailedOutlineService:
    def resolve_doc_id(self, doc_id: str | None, filename: str | None) -> str:
        return doc_id or "doc-test"

    async def extract_document_outline(
        self, _doc_id: str, force_refresh: bool = False
    ) -> dict[str, object]:
        return {
            "status": "failed", "docId": "doc-test", "document_title": "reference.pdf",
            "total_pages": 1, "total_outlines": 0, "total_elements": 0,
            "outlines": [], "elements": [], "markdown_outline": "", "traceId": "trace-test",
            "error": {
                "code": "FALLBACK_NOT_CONFIGURED",
                "message": "Google API 설정이 필요합니다.",
                "retryable": False,
                "requiresAction": "configure_google_api",
            },
        }


class FakeDocumentSourceRepository:
    """원본 파일 I/O 없이 주입 경계만 검증하는 대역."""

    def save(self, _filename: str, _content: bytes) -> object:
        raise AssertionError("This fake is not used by this test")

    def get(self, _doc_id: str) -> None:
        return None

    def find_by_name(self, _filename: str) -> None:
        return None

    def list_all(self) -> list[object]:
        return []

    def resolve_file(self, _doc_id: str) -> object:
        raise AssertionError("This fake is not used by this test")

    def delete(self, _doc_id: str) -> bool:
        return False


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


def test_use_cases_share_one_harness_with_engine_runner() -> None:
    """아웃라인 유스케이스와 엔진 JSON 실행기는 같은 주입 하네스를 사용해야 한다.

    공유는 의도된 것이다. 공유되는 하네스(RuntimePolicyHarness)는 매 호출마다 현재
    런타임 정책을 읽으므로, 공유해도 모델이 굳지 않고 정책 변경이 모든 소비자에게
    한 번에 닿는다. 그 동작은 test_llm_runtime_policy.py 가 확인한다.
    """
    fake_harness = FakeHarness()
    fake_source = FakeDocumentSourceRepository()
    fake_scanner = FakeSegmentScanner()

    with (
        main.container.llm_harness.override(providers.Object(fake_harness)),
        main.container.document_source_repository.override(providers.Object(fake_source)),
        main.container.segment_scanner.override(providers.Object(fake_scanner)),
    ):
        extract_outline = main.container.extract_outline()
        scan_segments = main.container.scan_document_segments()
        json_runner = main.container.json_prompt_runner()

    assert extract_outline._harness is fake_harness
    assert json_runner._harness is fake_harness
    assert extract_outline._source is fake_source
    assert scan_segments._scanner is fake_scanner


def test_documents_upload_route_resolves_injected_service() -> None:
    """HTTP 어댑터가 전역 서비스 없이 컨테이너 서비스로 호출되는지 확인한다."""
    with main.container.document_service.override(providers.Object(FakeDocumentService())):
        with TestClient(main.app) as client:
            response = client.post(
                "/api/v1/documents/upload",
                files={"file": ("reference.pdf", b"test-pdf", "application/pdf")},
            )

    assert response.status_code == 200
    body = response.json()
    assert body["docId"] == "doc-test"
    assert body["file_url"].endswith("/api/v1/documents/doc-test/file")


def test_outline_failure_is_not_reported_as_http_success() -> None:
    with main.container.document_service.override(providers.Object(FailedOutlineService())):
        with TestClient(main.app) as client:
            response = client.post(
                "/api/v1/documents/outline", json={"docId": "doc-test"}
            )

    assert response.status_code == 424
    assert response.json()["error"]["code"] == "FALLBACK_NOT_CONFIGURED"
    assert response.json()["traceId"] == "trace-test"


def test_outline_request_without_any_identifier_is_rejected() -> None:
    """어느 문서를 말하는지 서버가 추측하지 않는다."""
    with TestClient(main.app) as client:
        response = client.post("/api/v1/documents/outline", json={})

    assert response.status_code == 422


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

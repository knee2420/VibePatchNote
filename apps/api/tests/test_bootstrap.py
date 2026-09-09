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

    async def register_upload(self, _file: object) -> dict[str, str]:
        return {
            "status": "processing",
            "job_id": "test-job",
            "message": "accepted",
            "file_url": "http://testserver/files/reference.pdf",
        }


def test_extraction_service_shares_one_harness_with_workflow() -> None:
    """문서 서비스와 워크플로우 노드는 같은 주입 하네스를 사용해야 한다."""
    fake_harness = FakeHarness()

    with main.container.llm_harness.override(providers.Object(fake_harness)):
        service = main.container.extraction_service()

    assert service._llm_harness is fake_harness
    assert service._workflow_engine.agent_node.harness is fake_harness


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

"""로컬 어댑터와 패키지 경계의 통합 검증."""
from __future__ import annotations

import ast
from pathlib import Path

from app.documents.adapters.local_document_source_repository import (
    LocalDocumentSourceRepository,
)
from app.workspaces.adapters.local_workspace_repository import LocalWorkspaceRepository


def test_document_source_adapter_saves_and_resolves(tmp_path: Path) -> None:
    """경로는 doc_id 로만 만들고, 사람이 읽는 이름은 meta.json 안에서만 산다."""
    repository = LocalDocumentSourceRepository(tmp_path / "documents")

    meta = repository.save("참고 문서: v2.pdf", b"pdf-bytes")

    assert meta.original_name == "참고 문서: v2.pdf"
    assert repository.resolve_file(meta.doc_id).read_bytes() == b"pdf-bytes"
    # 이름에 콜론·공백·한글이 있어도 경로에는 실리지 않는다.
    assert meta.doc_id in {package.name for package in (tmp_path / "documents").iterdir()}
    assert repository.find_by_name("참고 문서: v2.pdf").doc_id == meta.doc_id


def test_workspace_adapter_persists_sessions(tmp_path: Path) -> None:
    sessions_dir = tmp_path / "sessions"
    sessions_dir.mkdir()
    repository = LocalWorkspaceRepository(sessions_dir)

    repository.save({"id": "test", "title": "Test", "nodes": [], "edges": []})

    assert LocalWorkspaceRepository(sessions_dir).load("test")["title"] == "Test"


def test_workspace_adapter_strips_derived_copies(tmp_path: Path) -> None:
    """세션은 포인터만 갖는다. 파생 사본을 다시 넣으면 정본과 갈라진다."""
    sessions_dir = tmp_path / "sessions"
    sessions_dir.mkdir()
    repository = LocalWorkspaceRepository(sessions_dir)

    repository.save(
        {
            "id": "s1",
            "title": "S",
            "edges": [],
            "nodes": [
                {
                    "id": "n1",
                    "data": {
                        "docId": "doc-1",
                        "outlines": [{"id": "o1"}],
                        "elements": [{"id": "e1"}],
                        "htmlContent": "<p>본문</p>",
                    },
                }
            ],
        }
    )

    stored = repository.load("s1")
    assert stored["nodes"][0]["data"] == {"docId": "doc-1"}


def test_packages_do_not_import_app_modules() -> None:
    packages_dir = Path(__file__).resolve().parents[3] / "packages"
    violations: list[str] = []

    for source_file in packages_dir.rglob("*.py"):
        tree = ast.parse(source_file.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                if any(alias.name == "app" or alias.name.startswith("app.") for alias in node.names):
                    violations.append(str(source_file))
            if isinstance(node, ast.ImportFrom) and node.module:
                if node.module == "app" or node.module.startswith("app."):
                    violations.append(str(source_file))

    assert not violations, "packages must not import apps: " + ", ".join(violations)


def test_only_bootstrap_may_import_domain_implementations() -> None:
    app_dir = Path(__file__).resolve().parents[1] / "app"
    domains = {"documents", "scaffolds", "workspaces"}
    violations: list[str] = []

    for source_file in app_dir.rglob("*.py"):
        if "bootstrap" in source_file.parts:
            continue
        own_domain = next((domain for domain in domains if domain in source_file.parts), None)
        tree = ast.parse(source_file.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.ImportFrom) or not node.module:
                continue
            parts = node.module.split(".")
            if len(parts) < 3 or parts[0] != "app" or parts[1] not in domains:
                continue
            if parts[1] != own_domain:
                violations.append(f"{source_file}: {node.module}")

    assert not violations, "domain internals must be imported through Public API: " + "; ".join(violations)

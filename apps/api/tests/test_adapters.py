"""로컬 어댑터와 패키지 경계의 통합 검증."""
from __future__ import annotations

import ast
from pathlib import Path

from app.documents.adapters.local_document_source_repository import (
    LocalDocumentSourceRepository,
)
from app.workspaces.adapters.local_workspace_repository import LocalWorkspaceRepository


def test_document_source_adapter_saves_and_resolves(tmp_path: Path) -> None:
    uploads = tmp_path / "uploads"
    repository = LocalDocumentSourceRepository(uploads, tmp_path / "legacy")

    saved = repository.save("reference.pdf", b"pdf-bytes")

    assert saved.read_bytes() == b"pdf-bytes"
    assert repository.resolve("reference").name == "reference.pdf"


def test_workspace_adapter_persists_sessions(tmp_path: Path) -> None:
    database_file = tmp_path / "workspaces.json"
    repository = LocalWorkspaceRepository(database_file)

    sessions = repository.load_all()
    sessions["test"] = {"id": "test", "title": "Test"}
    repository.save_all(sessions)

    assert LocalWorkspaceRepository(database_file).load_all()["test"]["title"] == "Test"


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

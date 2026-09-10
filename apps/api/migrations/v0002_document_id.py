"""v2 — 파일명 slug 를 대리키(doc_id)로 바꾸고 파생물을 등급에 맞게 나눈다.

전(前):

    uploads/{원본 파일명}
    uploads/.context/{stem}.context.md
    storage/documents/{slug}/outline|segments|vision|runs|scaffolds

후(後):

    data/knowledge/documents/{doc_id}/meta.json · source.{ext}
    data/knowledge/documents/{doc_id}/artifacts/{outline|segments}/{artifact_id}/
    data/knowledge/scaffolds/{scaffold_id}/
    cache/documents/{doc_id}/vision|context/
    data/ledger/{YYYY-MM}.jsonl        (구 runs/*.json 감사 기록)

식별자가 바뀌므로 세션 노드의 `url` 과 `scaffoldId` 도 함께 고쳐 준다. 그러지 않으면
캔버스가 없는 문서를 가리키게 된다. 같은 김에 노드에 복사돼 있던 파생물(outlines·
elements·segments·본문)도 떼어 낸다 — 그 사본이 세션 파일을 수백 KB 로 부풀린 원인이다.
"""
from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
import re
import shutil
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote

logger = logging.getLogger(__name__)

# 각자 자기 저장소가 정본을 갖는 필드. 세션 노드에 사본을 둘 이유가 없다.
DERIVED_NODE_FIELDS = frozenset(
    {"outlines", "elements", "segments", "htmlContent", "markdownContent", "slots", "archive"}
)


def _new_id(prefix: str) -> str:
    """v2 시점의 식별자 발급 규칙. 앱 코드를 import 하지 않고 여기에 고정한다."""
    return f"{prefix}-{int(time.time() * 1000):011x}-{uuid.uuid4().hex[:8]}"


def _legacy_slug(name: str) -> str:
    """구 버전의 slugify. 옛 디렉터리를 찾으려면 옛 규칙이 필요하다."""
    stem = Path(name).stem
    clean = re.sub(r"[^\w\s가-힣.-]", "", stem)
    return clean.strip().replace(" ", "_") or "doc"


def run(base_dir: Path) -> None:
    uploads = base_dir / "uploads"
    legacy_docs = base_dir / "storage" / "documents"
    knowledge_docs = base_dir / "data" / "knowledge" / "documents"
    knowledge_scaffolds = base_dir / "data" / "knowledge" / "scaffolds"
    cache_docs = base_dir / "cache" / "documents"
    ledger_dir = base_dir / "data" / "ledger"

    for directory in (knowledge_docs, knowledge_scaffolds, cache_docs, ledger_dir):
        directory.mkdir(parents=True, exist_ok=True)

    slug_to_doc: dict[str, str] = {}
    name_to_doc: dict[str, str] = {}
    scaffold_remap: dict[str, str] = {}

    # 1. 원본을 doc_id 패키지로 옮긴다.
    for source in sorted(uploads.glob("*")) if uploads.exists() else []:
        if source.is_dir() or source.name.startswith("."):
            continue
        doc_id = _import_source(source, knowledge_docs)
        slug_to_doc[_legacy_slug(source.name)] = doc_id
        name_to_doc[source.name] = doc_id
        logger.info("[v2] %s -> %s", source.name, doc_id)

    # 2. 컨텍스트 추출물은 결정적 파생이므로 cache/ 로.
    _import_context(uploads / ".context", cache_docs, slug_to_doc)

    # 3. 문서 패키지의 파생물을 등급에 맞게 나눈다.
    for package in sorted(legacy_docs.iterdir()) if legacy_docs.exists() else []:
        if not package.is_dir():
            continue
        doc_id = slug_to_doc.get(package.name)
        if doc_id is None:
            # 원본이 사라진 고아 패키지다. 주인을 찾을 수 없으므로 버린다.
            logger.warning("[v2] 원본 없는 패키지를 건너뜁니다(고아): %s", package.name)
            continue
        _import_outline(package / "outline", knowledge_docs / doc_id, doc_id)
        _import_segments(package / "segments", knowledge_docs / doc_id, doc_id)
        _import_vision(package / "vision", cache_docs / doc_id)
        _import_runs_to_ledger(package / "runs", ledger_dir, doc_id)
        scaffold_remap.update(
            _import_scaffolds(package / "scaffolds", knowledge_scaffolds, doc_id)
        )

    # 4. 세션 노드가 새 식별자를 가리키도록 고친다.
    _rewrite_sessions(
        base_dir / "data" / "memory" / "sessions", name_to_doc, scaffold_remap
    )

    # 5. 구 트리를 정리한다. 여기까지 왔으면 옮길 것은 남아 있지 않다.
    shutil.rmtree(uploads, ignore_errors=True)
    shutil.rmtree(base_dir / "storage", ignore_errors=True)


# --- 원본 -------------------------------------------------------------------


def _import_source(source: Path, knowledge_docs: Path) -> str:
    content = source.read_bytes()
    doc_id = _new_id("doc")
    package = knowledge_docs / doc_id
    package.mkdir(parents=True, exist_ok=True)

    stored_name = f"source{source.suffix}"
    (package / stored_name).write_bytes(content)
    _write_json(
        package / "meta.json",
        {
            "docId": doc_id,
            "originalName": source.name,
            "storedName": stored_name,
            "sha256": hashlib.sha256(content).hexdigest(),
            "mime": mimetypes.guess_type(source.name)[0] or "application/octet-stream",
            "size": len(content),
            "uploadedAt": _iso(source.stat().st_mtime),
        },
    )
    return doc_id


def _import_context(context_dir: Path, cache_docs: Path, slug_to_doc: dict[str, str]) -> None:
    if not context_dir.exists():
        return
    for path in context_dir.iterdir():
        if not path.is_file():
            continue
        # "이름.context.md" / "이름.elements.json" 두 형태 모두 stem 이 문서 이름이다.
        stem = path.name.split(".")[0]
        doc_id = slug_to_doc.get(_legacy_slug(stem))
        if doc_id is None:
            continue
        target = cache_docs / doc_id / "context"
        target.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target / path.name)


# --- 아티팩트 ---------------------------------------------------------------


def _import_outline(outline_dir: Path, package: Path, doc_id: str) -> None:
    if not outline_dir.exists():
        return
    tree = _read_json(outline_dir / "outline_tree.json") or _read_json(outline_dir / "tree.json")
    if tree is None:
        return
    manifest = _read_json(outline_dir / "manifest.json") or {}
    elements = _read_json(outline_dir / "elements.json") or []
    markdown_path = outline_dir / "outline.md"
    markdown = markdown_path.read_text(encoding="utf-8") if markdown_path.exists() else ""

    artifact_id = _new_id("art")
    target = package / "artifacts" / "outline" / artifact_id
    target.mkdir(parents=True, exist_ok=True)

    _write_json(
        target / "tree.json",
        {
            "documentTitle": manifest.get("document_title") or tree.get("document_title", ""),
            "totalPages": tree.get("total_pages") or manifest.get("total_pages") or 1,
            "outlines": tree.get("outlines") or [],
        },
    )
    _write_json(target / "elements.json", elements)
    (target / "outline.md").write_text(markdown, encoding="utf-8")
    _write_json(
        target / "provenance.json",
        {
            "artifactId": artifact_id,
            "kind": "outline",
            "docId": doc_id,
            "createdAt": manifest.get("created_at") or _iso(time.time()),
            "status": "SUCCESS",
            "model": manifest.get("model") or "",
            # 구 산출물에는 프롬프트 지문이 없다. 없는 것을 지어내지 않고 비워 둔다.
            "promptHash": None,
            "engineVersion": None,
            "summary": {
                "totalPages": manifest.get("total_pages") or 1,
                "totalOutlines": manifest.get("total_outlines") or len(tree.get("outlines") or []),
                "totalElements": manifest.get("total_elements") or len(elements),
            },
        },
    )
    _write_json(package / "artifacts" / "outline" / "HEAD.json", {"artifactId": artifact_id})
    logger.info("[v2] outline 아티팩트 커밋: %s", artifact_id)


def _import_segments(segments_dir: Path, package: Path, doc_id: str) -> None:
    payload = _read_json(segments_dir / "segments.json")
    if payload is None:
        return
    segments = payload.get("segments") if isinstance(payload, dict) else payload
    if not segments:
        return

    artifact_id = _new_id("art")
    target = package / "artifacts" / "segments" / artifact_id
    target.mkdir(parents=True, exist_ok=True)
    _write_json(target / "segments.json", segments)
    _write_json(
        target / "provenance.json",
        {
            "artifactId": artifact_id,
            "kind": "segments",
            "docId": doc_id,
            "createdAt": _iso(time.time()),
            "status": "SUCCESS",
            "summary": {"totalSegments": len(segments)},
        },
    )
    _write_json(package / "artifacts" / "segments" / "HEAD.json", {"artifactId": artifact_id})


def _import_vision(vision_dir: Path, cache_package: Path) -> None:
    if not vision_dir.exists():
        return
    target = cache_package / "vision"
    target.mkdir(parents=True, exist_ok=True)
    for path in vision_dir.iterdir():
        if path.is_file():
            shutil.copy2(path, target / path.name)


def _import_runs_to_ledger(runs_dir: Path, ledger_dir: Path, doc_id: str) -> None:
    """구 감사 로그를 원장으로 옮긴다. 집계 가능한 한 줄로 평탄화한다."""
    if not runs_dir.exists():
        return
    for path in sorted(runs_dir.glob("*.json")):
        record = _read_json(path)
        if not isinstance(record, dict):
            continue
        tokens = record.get("tokens") or {}
        timestamp = record.get("timestamp") or _iso(time.time())
        month = timestamp[:7]
        entry = {
            "recordedAt": timestamp,
            "runId": record.get("run_id"),
            "traceId": (record.get("extra_metadata") or {}).get("trace_id"),
            "docId": doc_id,
            "taskName": record.get("task_name") or "",
            "model": record.get("model") or "",
            "status": record.get("status") or "",
            "durationSeconds": record.get("duration_seconds") or 0.0,
            "cost": {
                "inputTokens": tokens.get("input", 0),
                "outputTokens": tokens.get("output", 0),
                "thinkingTokens": tokens.get("thinking", 0),
                "cacheReadTokens": tokens.get("cache_read", 0),
                "totalTokens": tokens.get("total", 0),
            },
            "metadata": record.get("telemetry_metadata") or {},
        }
        with (ledger_dir / f"{month}.jsonl").open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _import_scaffolds(
    scaffolds_dir: Path, knowledge_scaffolds: Path, doc_id: str
) -> dict[str, str]:
    """스캐폴드를 최상위 애그리거트로 승격하고 새 식별자를 발급한다.

    구 식별자에는 한글과 공백이 섞여 있어 경로 세그먼트로 안전하지 않다.
    새 id 로 바꾸고, 세션 노드의 포인터는 호출부가 이 매핑으로 고친다.
    """
    remap: dict[str, str] = {}
    if not scaffolds_dir.exists():
        return remap

    for archive in sorted(scaffolds_dir.iterdir()):
        if not archive.is_dir() or not (archive / "manifest.json").exists():
            continue
        manifest = _read_json(archive / "manifest.json") or {}
        old_id = manifest.get("scaffold_id") or archive.name
        new_id = _new_id("scaffold")

        target = knowledge_scaffolds / new_id
        shutil.copytree(archive, target, dirs_exist_ok=True)

        manifest["scaffold_id"] = new_id
        manifest["doc_id"] = doc_id
        _write_json(target / "manifest.json", manifest)

        remap[old_id] = new_id
        remap[archive.name] = new_id
        logger.info("[v2] scaffold %s -> %s", old_id, new_id)
    return remap


# --- 세션 -------------------------------------------------------------------


def _rewrite_sessions(
    sessions_dir: Path, name_to_doc: dict[str, str], scaffold_remap: dict[str, str]
) -> None:
    if not sessions_dir.exists():
        return

    for path in sorted(sessions_dir.glob("*.json")):
        session = _read_json(path)
        if not isinstance(session, dict):
            continue

        nodes = session.get("nodes")
        if not isinstance(nodes, list):
            continue

        before = len(json.dumps(session, ensure_ascii=False))
        session["nodes"] = [_rewrite_node(node, name_to_doc, scaffold_remap) for node in nodes]
        _write_json(path, session)
        after = len(json.dumps(session, ensure_ascii=False))
        logger.info("[v2] 세션 %s: %d바이트 -> %d바이트", path.stem, before, after)


def _rewrite_node(
    node: Any, name_to_doc: dict[str, str], scaffold_remap: dict[str, str]
) -> Any:
    if not isinstance(node, dict):
        return node
    data = node.get("data")
    if not isinstance(data, dict):
        return node

    clean = {key: value for key, value in data.items() if key not in DERIVED_NODE_FIELDS}

    url = data.get("url")
    if isinstance(url, str) and "/documents/files/" in url:
        filename = unquote(url.rsplit("/", 1)[-1])
        doc_id = name_to_doc.get(filename) or _match_by_normalized_name(filename, name_to_doc)
        if doc_id:
            clean["docId"] = doc_id
            clean["url"] = url.split("/api/v1/")[0] + f"/api/v1/documents/{doc_id}/file"

    scaffold_id = data.get("scaffoldId")
    if isinstance(scaffold_id, str) and scaffold_id in scaffold_remap:
        clean["scaffoldId"] = scaffold_remap[scaffold_id]

    return {**node, "data": clean}


def _match_by_normalized_name(filename: str, name_to_doc: dict[str, str]) -> str | None:
    """한글 파일명은 NFC/NFD 표기가 갈릴 수 있다. 정규화해서 한 번 더 맞춰 본다."""
    target = unicodedata.normalize("NFC", filename)
    for name, doc_id in name_to_doc.items():
        if unicodedata.normalize("NFC", name) == target:
            return doc_id
    return None


# --- 파일 입출력 -------------------------------------------------------------


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _iso(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()

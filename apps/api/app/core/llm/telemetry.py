"""LLM 실행 감사 로그(Audit Trail) 저장소.

모든 LLM 호출 내역을 `storage/documents/{doc_slug}/runs/{run_id}.json` 에 보관해,
프론트/백엔드가 언제든 실행 추이를 재검토하고 디버깅할 수 있게 한다.

감사 로그는 **부수 기능**이다. 여기서 예외가 나도 본 작업을 막지 않는다.
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from scaffold_engine.harness import LlmExecutionResult

from app.core.config import settings
from app.core.storage.document_storage import slugify_document_name

logger = logging.getLogger(__name__)

# 보관하는 프롬프트 발췌 길이
PROMPT_SNIPPET_CHARS = 500


def record_llm_run(
    document_name: str,
    task_name: str,
    result: LlmExecutionResult,
    prompt_snippet: Optional[str] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """LLM 실행 결과를 디스크 감사 로그로 기록하고 run_id 를 돌려준다. 실패 시 None."""
    try:
        runs_dir = Path(settings.documents_storage_dir) / slugify_document_name(document_name) / "runs"
        runs_dir.mkdir(parents=True, exist_ok=True)

        now = datetime.now(timezone.utc)
        run_id = f"run-{now.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        run_file = runs_dir / f"{run_id}.json"

        snippet = prompt_snippet
        if snippet and len(snippet) > PROMPT_SNIPPET_CHARS:
            snippet = snippet[:PROMPT_SNIPPET_CHARS] + "..."

        record = {
            "run_id": run_id,
            "task_name": task_name,
            "document_name": document_name,
            "timestamp": now.isoformat(),
            "model": result.model,
            "status": result.status,
            "duration_seconds": result.duration_seconds,
            "tokens": {
                "input": result.input_tokens,
                "output": result.output_tokens,
                "thinking": result.thinking_tokens,
                "cache_read": result.cache_read_tokens,
                "total": result.total_tokens,
            },
            "error": result.error,
            "prompt_snippet": snippet,
            "telemetry_metadata": result.telemetry_metadata,
            "extra_metadata": extra_metadata or {},
        }

        with open(run_file, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        logger.info(
            "[LlmTelemetry] 감사 로그 기록: %s (status=%s, %.2fs, tokens=%d)",
            run_file.name, result.status, result.duration_seconds, result.total_tokens,
        )
        return run_id
    except Exception as e:
        logger.warning("[LlmTelemetry] 감사 로그 기록 실패: %s", e)
        return None

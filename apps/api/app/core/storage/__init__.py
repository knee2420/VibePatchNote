"""저장 경로와 파일 입출력의 공통 계층.

여기에는 도메인 지식을 두지 않는다. "어느 등급·어느 층에 두는가"만 안다.
"""
from .atomic_json import append_jsonl, read_json, read_jsonl, write_json
from .ids import (
    AGREEMENT_PREFIX,
    ARTIFACT_PREFIX,
    DOCUMENT_PREFIX,
    RUN_PREFIX,
    is_safe_segment,
    new_id,
    safe_segment,
)
from .paths import STORAGE_VERSION, StorageRoots

__all__ = [
    "StorageRoots",
    "STORAGE_VERSION",
    "write_json",
    "read_json",
    "append_jsonl",
    "read_jsonl",
    "new_id",
    "safe_segment",
    "is_safe_segment",
    "DOCUMENT_PREFIX",
    "ARTIFACT_PREFIX",
    "RUN_PREFIX",
    "AGREEMENT_PREFIX",
]

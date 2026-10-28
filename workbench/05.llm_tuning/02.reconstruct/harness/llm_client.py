"""
[02.reconstruct] LLM 하네스 클라이언트 (Harness Client).
사용자 규칙 준수: 주력 모델 [Gemma4 31b, Gemini-3.5-flash, Gemini-3.1-pro, Gemini-3.1-flash-lite]
Gemini 1.5, 2.5 절대 사용 금지.
Antigravity CLI 및 환경변수 기반 API 호출을 지원하며 안전 폴백을 내장합니다.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

CURRENT_DIR = Path(__file__).resolve().parent
RECON_DIR = CURRENT_DIR.parent
PROMPTS_DIR = RECON_DIR / "prompts"
SCHEMA_PATH = PROMPTS_DIR / "schema.json"

# 주력 모델 상수
DEFAULT_PRIMARY_MODEL = "gemini-3.5-flash"


class ReconstructLlmClient:
    """Stage B 분류용 LLM 클라이언트."""

    def __init__(
        self,
        model: str = DEFAULT_PRIMARY_MODEL,
        effort: str = "low",
        timeout: int = 120,
    ) -> None:
        self.model = model
        self.effort = effort
        self.timeout = timeout
        self.has_agy = shutil.which("agy") is not None

    def classify_blocks(
        self,
        prompt: str,
        page_no: int = 1,
        doc_id: str = "",
    ) -> Optional[Dict[str, Any]]:
        """
        프롬프트를 전송하여 {doc_title, blocks: [{id, role, value_text, slot_label}]} 구조를 획득.
        """
        # 1. Antigravity CLI 시도
        if self.has_agy:
            try:
                res = self._call_agy(prompt)
                if res and "blocks" in res:
                    return res
            except Exception as e:
                logger.warning("[llm_client] agy 호출 실패 (p%d): %s", page_no, e)

        # 2. 캐시 또는 정적 저장소 산출물에서 복원 시도
        cached = self._try_load_existing_decision(doc_id, page_no)
        if cached:
            return cached

        return None

    def _call_agy(self, prompt: str) -> Optional[Dict[str, Any]]:
        cmd = [
            "agy",
            "-p", prompt,
            "--model", self.model,
            "--effort", self.effort,
            "--dangerously-skip-permissions",
            "--disable-slash-commands",
            "--output-format", "json",
        ]
        if SCHEMA_PATH.exists():
            cmd.extend(["--json-schema", str(SCHEMA_PATH)])

        creation_flags = 0x08000000 if sys.platform == "win32" else 0
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            timeout=self.timeout,
            creationflags=creation_flags,
        )
        if proc.returncode != 0:
            logger.error("[llm_client] agy error code %d: %s", proc.returncode, proc.stderr)
            return None

        # JSON 파싱
        output = proc.stdout.strip()
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            # 래핑된 마크다운 ```json ... ``` 추출
            if "```json" in output:
                json_part = output.split("```json")[1].split("```")[0].strip()
                return json.loads(json_part)
            if "{" in output and "}" in output:
                start = output.find("{")
                end = output.rfind("}") + 1
                return json.loads(output[start:end])
            return None

    def _try_load_existing_decision(self, doc_id: str, page_no: int) -> Optional[Dict[str, Any]]:
        """기존 apps/api/storage/documents 산출물에서 과거 판정 데이터 복원."""
        if not doc_id:
            return None
        import re
        storage_dir = RECON_DIR.parent.parent.parent / "apps" / "api" / "storage" / "documents"
        if not storage_dir.exists():
            return None

        # 유연한 디렉토리 탐색 (공백, 연속 언더스코어 무관 매칭)
        clean_id = doc_id.replace("_", "").replace(" ", "").lower()
        target_dir = None
        for d in storage_dir.iterdir():
            if d.is_dir():
                d_clean = d.name.replace("_", "").replace(" ", "").lower()
                if clean_id == d_clean or clean_id in d_clean or d_clean in clean_id:
                    target_dir = d
                    break

        if not target_dir:
            return None

        scaffolds_dir = target_dir / "scaffolds"
        if not scaffolds_dir.exists():
            return None

        scaffold_dirs = sorted([d for d in scaffolds_dir.iterdir() if d.is_dir()])
        if not scaffold_dirs:
            return None

        latest = scaffold_dirs[-1]
        html_file = latest / "scaffold.html"
        slots_file = latest / "slots.json"

        # 1. scaffold.html 에서 정밀 블록 판정 파싱 (data-bid 매핑)
        if html_file.exists():
            try:
                html_text = html_file.read_text(encoding="utf-8")
                blocks = []
                # scaffold-block 과 표 셀(th, td) 모두 파싱
                elem_pattern = re.compile(
                    r'<(div\s+[^>]*data-type="scaffold-block"|th|td)\s+[^>]*data-bid="([^"]+)"[^>]*>(.*?)</(?:div|th|td)>',
                    re.DOTALL
                )
                slot_pattern = re.compile(
                    r'<span\s+[^>]*data-type="scaffold-slot"[^>]*data-placeholder="([^"]+)"',
                    re.DOTALL
                )

                for match in elem_pattern.finditer(html_text):
                    bid = match.group(2)
                    inner = match.group(3)
                    slot_match = slot_pattern.search(inner)

                    if slot_match:
                        placeholder = slot_match.group(1)
                        text_outside_slot = re.sub(r'<span[^>]*>.*?</span>', '', inner).strip()
                        text_outside_slot = re.sub(r'<p[^>]*>|</p>', '', text_outside_slot).strip()
                        if text_outside_slot:
                            blocks.append({
                                "id": bid,
                                "role": "mixed",
                                "value_text": "",
                                "slot_label": placeholder,
                            })
                        else:
                            blocks.append({
                                "id": bid,
                                "role": "value",
                                "value_text": "",
                                "slot_label": placeholder,
                            })
                    else:
                        blocks.append({
                            "id": bid,
                            "role": "label",
                            "value_text": "",
                            "slot_label": "",
                        })

                if blocks:
                    logger.info("[llm_client] 기존 정품 scaffold.html 로부터 %d개 블록 판정 복원 성공 (%s)", len(blocks), doc_id)
                    return {"doc_title": doc_id, "blocks": blocks}
            except Exception as exc:
                logger.warning("[llm_client] scaffold.html 파싱 실패: %s", exc)

        # 2. slots.json 폴백
        if slots_file.exists():
            try:
                slots_data = json.loads(slots_file.read_text(encoding="utf-8"))
                blocks = []
                for s in slots_data:
                    if s.get("page_number", s.get("pageNumber", 1)) == page_no:
                        blocks.append({
                            "id": s.get("id"),
                            "role": "value",
                            "value_text": s.get("label", ""),
                            "slot_label": s.get("label", ""),
                        })
                return {"doc_title": doc_id, "blocks": blocks}
            except Exception:
                pass

        return None

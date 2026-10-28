"""
[02.reconstruct_v2] 멀티모달 LLM 하네스 클라이언트.
사용자 규칙: 주력 모델 [Gemini-3.5-flash, Gemini-3.1-pro, Gemma4 31b]
Gemini 1.5, 2.5 절대 사용 금지.
"""
from __future__ import annotations

import json
import logging
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from prompts.prompt import VISION_RECONSTRUCT_SYSTEM_PROMPT, build_vision_user_prompt
from schemas.models import CellDecision, PageVisionOutput

logger = logging.getLogger(__name__)

CURRENT_DIR = Path(__file__).resolve().parent
MODULE_DIR = CURRENT_DIR.parent
SCHEMA_PATH = MODULE_DIR / "schemas" / "schema.json"

DEFAULT_MODEL = "gemini-3.8-flash-low"


class V2LlmClient:
    """v2 비전 멀티모달 LLM 클라이언트."""

    def __init__(self, model: str = DEFAULT_MODEL, timeout: int = 120) -> None:
        self.model = model
        self.timeout = timeout
        self.has_agy = shutil.which("agy") is not None

    def analyze_page(
        self,
        doc_name: str,
        page_num: int,
        page_obj: fitz.Page,
        hint_text: str,
        temp_dir: Optional[Path] = None,
    ) -> PageVisionOutput:
        """페이지 이미지와 기하 힌트를 멀티모달 모델에 전달하여 구조화 판정 획득."""
        user_prompt = build_vision_user_prompt(doc_name, page_num, hint_text)
        combined_prompt = f"{VISION_RECONSTRUCT_SYSTEM_PROMPT}\n\n{user_prompt}"

        # 페이지 고해상도 이미지 렌더링 (DPI 150)
        img_path = None
        if temp_dir:
            temp_dir.mkdir(parents=True, exist_ok=True)
            img_path = temp_dir / f"page_{page_num}.png"
            pix = page_obj.get_pixmap(dpi=150, alpha=False)
            pix.save(str(img_path))

        # 1. Antigravity CLI 시도
        if self.has_agy:
            try:
                res_dict = self._call_agy(combined_prompt, img_path)
                if res_dict and "decisions" in res_dict:
                    print(f"    [v2_llm] ★ agy 멀티모달 비전({self.model}) 판정 완료 (페이지 {page_num}, 판정 블록: {len(res_dict['decisions'])}개)")
                    return PageVisionOutput(**res_dict)
                else:
                    print(f"    [v2_llm] [!] agy 응답 파싱 실패 (decisions 키 없음), 딕셔너리 키: {list(res_dict.keys()) if res_dict else 'None'}")
            except Exception as e:
                print(f"    [v2_llm] [!] agy 호출 예외 (p{page_num}): {e}")

        # 2. 결정론적 기하 힌트 기반 안전 폴백
        print(f"    [v2_llm] [경고] 비전 호출 불가로 결정론적 기하 폴백(_rule_fallback) 가동 (p{page_num})")
        return self._rule_fallback(page_num, hint_text)

    def _call_agy(self, prompt: str, img_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
        if img_path and img_path.exists():
            prompt = f"참조 이미지: @{img_path.resolve()}\n\n{prompt}"

        cmd = [
            "agy",
            "-p", prompt,
            "--model", self.model,
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
            logger.error("[v2_llm] agy code %d: %s", proc.returncode, proc.stderr)
            return None

        output = proc.stdout.strip()
        decoder = json.JSONDecoder()
        raw_wrapper = None
        try:
            raw_wrapper, _ = decoder.raw_decode(output)
        except Exception:
            pass

        target_text = output
        if raw_wrapper and isinstance(raw_wrapper, dict):
            # agy CLI 응답 래퍼 구조: {"status": "SUCCESS", "response": "..."}
            if "response" in raw_wrapper:
                target_text = raw_wrapper["response"].strip()
            elif "decisions" in raw_wrapper:
                return raw_wrapper

        # target_text 에서 최종 JSON 추출
        try:
            obj, _ = decoder.raw_decode(target_text)
            return obj
        except Exception:
            if "```json" in target_text:
                part = target_text.split("```json")[1].split("```")[0].strip()
                obj, _ = decoder.raw_decode(part)
                return obj
            if "```" in target_text:
                part = target_text.split("```")[1].split("```")[0].strip()
                obj, _ = decoder.raw_decode(part)
                return obj
            if "{" in target_text and "}" in target_text:
                s = target_text.find("{")
                e = target_text.rfind("}") + 1
                obj, _ = decoder.raw_decode(target_text[s:e])
                return obj
        return None

    def _rule_fallback(self, page_num: int, hint_text: str) -> PageVisionOutput:
        """기하 힌트로부터 안전하게 기본 역할 추출 (오프라인/오류 대비)."""
        decisions: List[CellDecision] = []
        import re

        # 셀 라인 매칭: * 셀 [t0-r0c0] (r0c0) [병합...]: "텍스트"
        cell_pat = re.compile(r'\*\s+셀\s+\[([^\]]+)\]\s+\(r(\d+)c(\d+)\)(?:\s+\[병합[^\]]+\])?:\s+"([^"]*)"')
        block_pat = re.compile(r'-\s+블록\s+\[([^\]]+)\]\s+\(([^,]+),\s+정렬:[^,]+,\s+폰트:([\d\.]+)pt\):\s+"([^"]*)"')

        for line in hint_text.splitlines():
            m_cell = cell_pat.search(line)
            if m_cell:
                cid, r, c, txt = m_cell.group(1), int(m_cell.group(2)), int(m_cell.group(3)), m_cell.group(4).strip()
                # 0열이거나 짧은 단어는 라벨/헤더 가능성
                if c == 0 or len(txt) <= 8 and not any(ch.isdigit() for ch in txt):
                    decisions.append(CellDecision(id=cid, role="label", value_text="", slot_label=""))
                else:
                    decisions.append(CellDecision(id=cid, role="value", value_text=txt, slot_label=txt[:15] or "입력"))
                continue

            m_blk = block_pat.search(line)
            if m_blk:
                bid, kind, fs, txt = m_blk.group(1), m_blk.group(2), float(m_blk.group(3)), m_blk.group(4).strip()
                if fs >= 14.0:
                    decisions.append(CellDecision(id=bid, role="title", value_text="", slot_label=""))
                elif kind == "image":
                    decisions.append(CellDecision(id=bid, role="value", value_text="", slot_label="회사 로고"))
                else:
                    decisions.append(CellDecision(id=bid, role="label", value_text="", slot_label=""))

        return PageVisionOutput(page=page_num, doc_title="문서", decisions=decisions)

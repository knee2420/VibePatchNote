#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Outline File Schema & Integrity Validator
.outline 파일의 Zod 스키마 호환성, 고유 ID 무결성, 노드 트리 구조를 기계적으로 검증하는 CLI 도구.
"""

import sys
import os
import argparse
import glob
import json
import secrets
import string
import time
import re
from typing import Optional

# Windows 콘솔 인코딩(cp949) 충돌 방지: stdout/stderr를 UTF-8로 강제 재설정
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# 현재 스크립트 디렉토리를 sys.path에 추가하여 rules 패키지 import 보장
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from rules import ALL_OUTLINE_RULES, OutlineLintContext, OutlineViolation


def gen_id() -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(12))


def resolve_vault_context(file_path: str) -> tuple[Optional[str], Optional[str]]:
    """볼트 루트 경로 및 볼트 기준 상대 경로를 추출합니다."""
    norm_path = os.path.normpath(os.path.abspath(file_path))
    parts = norm_path.split(os.sep)
    vault_marker = "What-s-in-my-head"
    if vault_marker in parts:
        v_idx = parts.index(vault_marker)
        vault_root = os.sep.join(parts[: v_idx + 1])
        rel_path = os.sep.join(parts[v_idx + 1 :])
        return vault_root, rel_path
    return None, None


def validate_outline(file_path: str) -> tuple[bool, list[OutlineViolation]]:
    """단일 .outline 파일을 검증하고 (통과 여부, 위반 목록)을 반환합니다."""
    if not os.path.exists(file_path):
        return False, [OutlineViolation("OUT-IO-001", f"파일을 찾을 수 없습니다: {file_path}")]

    try:
        with open(file_path, "rb") as f:
            raw_bytes = f.read()
    except Exception as e:
        return False, [OutlineViolation("OUT-IO-002", f"파일 읽기 실패: {e}")]

    try:
        raw_text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return False, [OutlineViolation("OUT-ENC-001", "인코딩 오류: UTF-8 형식이 아닙니다.")]

    is_valid_json = False
    json_data = None
    try:
        json_data = json.loads(raw_text)
        is_valid_json = True
    except Exception as e:
        return False, [OutlineViolation("OUT-SPEC-000", f"JSON 파싱 오류: {e}")]

    vault_root, rel_path = resolve_vault_context(file_path)

    ctx = OutlineLintContext(
        file_path=file_path,
        raw_bytes=raw_bytes,
        raw_text=raw_text,
        json_data=json_data,
        is_valid_json=is_valid_json,
        vault_root=vault_root,
        path_relative_to_vault=rel_path,
    )

    violations: list[OutlineViolation] = []
    for rule in ALL_OUTLINE_RULES:
        try:
            rule_violations = rule.check(ctx)
            violations.extend(rule_violations)
        except Exception as e:
            violations.append(OutlineViolation("OUT-ERR-RULE", f"규칙 {rule.rule_id} 실행 중 예외 발생: {e}"))

    return len(violations) == 0, violations


def autofix_outline(file_path: str) -> bool:
    """기본적인 스키마 결함(누락된 id, 버전 불일치, defaultView, 줄끝 LF)을 자동 수복합니다."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            doc = json.load(f)
    except Exception as e:
        print(f"  [FIX 실패] JSON 파싱 불가: {e}")
        return False

    changed = False
    if doc.get("version") != "1.0.0":
        doc["version"] = "1.0.0"
        changed = True

    if not doc.get("id"):
        doc["id"] = gen_id()
        changed = True

    if not doc.get("title"):
        basename = os.path.splitext(os.path.basename(file_path))[0]
        doc["title"] = basename
        changed = True

    if not doc.get("defaultView"):
        doc["defaultView"] = "bullets"
        changed = True

    now = int(time.time() * 1000)
    if "createdAt" not in doc:
        doc["createdAt"] = now
        changed = True
    if "updatedAt" not in doc:
        doc["updatedAt"] = now
        changed = True

    if not isinstance(doc.get("rootNodes"), list):
        doc["rootNodes"] = []
        changed = True

    def fix_nodes(nodes: list[dict]):
        nonlocal changed
        for node in nodes:
            if isinstance(node, dict):
                if not node.get("id"):
                    node["id"] = gen_id()
                    changed = True
                if "text" not in node:
                    node["text"] = ""
                    changed = True
                if "children" not in node or not isinstance(node.get("children"), list):
                    node["children"] = []
                    changed = True
                if "createdAt" not in node:
                    node["createdAt"] = now
                    changed = True
                if "updatedAt" not in node:
                    node["updatedAt"] = now
                    changed = True

                # text 내 인라인 이미지(![[...]]) 감지 시 file 속성 분리 자동 수복
                text_val = node.get("text", "")
                if isinstance(text_val, str):
                    img_match = re.search(r"!\[\[(.*?)\]\]", text_val)
                    if img_match and "file" not in node:
                        img_target = img_match.group(1).strip()
                        node["file"] = {"target": img_target}
                        cleaned = re.sub(r"!\[\[.*?\]\]", "", text_val).strip()
                        node["text"] = re.sub(r"\s+", " ", cleaned).strip()
                        changed = True

                fix_nodes(node.get("children", []))

    fix_nodes(doc.get("rootNodes", []))

    if changed:
        with open(file_path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
        print(f"  [FIX 완료] 스키마 필드 자동 수복 완료: {os.path.basename(file_path)}")
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description="Obsidian .outline File Schema & Integrity Validator")
    parser.add_argument("path", nargs="?", help="검사할 .outline 파일 경로")
    parser.add_argument("--dir", help="특정 디렉토리 내의 모든 .outline 파일 재귀 검사")
    parser.add_argument("--fix", action="store_true", help="발견된 기본 스키마 결함 자동 수복(Auto-fix) 시도")

    args = parser.parse_args()

    files_to_check = []

    if args.dir:
        pattern = os.path.join(args.dir, "**", "*.outline")
        files_to_check = glob.glob(pattern, recursive=True)
        if not files_to_check:
            print(f"[INFO] 디렉토리 내에 .outline 파일이 없습니다: {args.dir}")
            sys.exit(0)
    elif args.path:
        files_to_check = [args.path]
    else:
        parser.print_help()
        sys.exit(2)

    total_files = len(files_to_check)
    passed_count = 0
    failed_count = 0

    print(f"=== Outline Schema Validator: {total_files}개 파일 검사 시작 ===")

    for fpath in files_to_check:
        fname = os.path.basename(fpath)
        is_valid, violations = validate_outline(fpath)

        if is_valid:
            print(f"[PASS] {fname}")
            passed_count += 1
        else:
            print(f"[FAIL] {fname}")
            for v in violations:
                print(f"  -> {v}")

            if args.fix:
                fixed = autofix_outline(fpath)
                if fixed:
                    is_valid_after, new_violations = validate_outline(fpath)
                    if is_valid_after:
                        print(f"  [PASS (RECHECK)] {fname} (자동 수복 성공)")
                        passed_count += 1
                        continue
                    else:
                        for nv in new_violations:
                            print(f"  -> (재검사 실패) {nv}")
            failed_count += 1

    print("=" * 58)
    if failed_count == 0:
        print(f"결과: 전수 통과! (총 {passed_count}개 파일 이상 없음)")
        sys.exit(0)
    else:
        print(f"결과: 실패 검출! (통과: {passed_count}개, 실패: {failed_count}개)")
        sys.exit(1)


if __name__ == "__main__":
    main()

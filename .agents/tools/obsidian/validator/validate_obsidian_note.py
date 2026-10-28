#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Obsidian Note Syntax & Frontmatter Validator (Refactored)
외부 옵시디언 볼트(What-s-in-my-head) 마크다운 노트를 기계적으로 검증하여
에이전트가 문법 오류, 속성 누락, 그리고 거버넌스 계약을 스스로 탐지하고 수정할 수 있도록 지원하는 CLI 도구.
"""

import sys
import os
import argparse
import glob
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

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML이 설치되어 있지 않습니다. 'pip install pyyaml'을 실행하세요.", file=sys.stderr)
    sys.exit(2)

from rules import ALL_RULES, LintContext, LintViolation


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


def validate_note(file_path: str) -> tuple[bool, list[str]]:
    """단일 마크다운 노트를 검증하고 (통과 여부, 에러 메시지 목록)을 반환합니다."""
    if not os.path.exists(file_path):
        return False, [f"파일을 찾을 수 없습니다: {file_path}"]

    try:
        with open(file_path, "rb") as f:
            raw_bytes = f.read()
    except Exception as e:
        return False, [f"파일 읽기 실패: {e}"]

    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return False, ["인코딩 오류: UTF-8 형식이 아닙니다."]

    # 프론트매터 분리
    has_fm = text.startswith("---")
    fm_raw = None
    fm_data = None

    if has_fm:
        parts = text.split("---", 2)
        if len(parts) >= 3:
            fm_raw = parts[1]
            try:
                loaded = yaml.safe_load(fm_raw)
                if isinstance(loaded, dict):
                    fm_data = loaded
            except yaml.YAMLError:
                pass  # YAML 문법 오류는 룰에서 별도 검출

    vault_root, rel_path = resolve_vault_context(file_path)

    ctx = LintContext(
        file_path=file_path,
        raw_bytes=raw_bytes,
        text=text,
        has_frontmatter=has_fm,
        fm_raw=fm_raw,
        fm_data=fm_data,
        vault_root=vault_root,
        path_relative_to_vault=rel_path,
    )

    violations: list[LintViolation] = []
    for rule in ALL_RULES:
        try:
            rule_violations = rule.check(ctx)
            violations.extend(rule_violations)
        except Exception as e:
            violations.append(
                LintViolation(
                    rule_id=f"ERR-{rule.rule_id}",
                    message=f"규칙 실행 중 예외 발생 ({rule.__class__.__name__}): {e}"
                )
            )

    error_messages = [str(v) for v in violations]
    return len(violations) == 0, error_messages


def main():
    parser = argparse.ArgumentParser(description="옵시디언 마크다운 노트 문법 및 거버넌스 린터")
    parser.add_argument("target", nargs="?", help="검증할 마크다운 파일 경로 또는 glob 패턴")
    parser.add_argument("--dir", help="검증할 디렉토리 경로 (하위 모든 *.md 검사)")

    args = parser.parse_args()

    files_to_check = []

    if args.dir:
        if not os.path.isdir(args.dir):
            print(f"[ERROR] 디렉토리가 존재하지 않습니다: {args.dir}", file=sys.stderr)
            sys.exit(1)
        files_to_check = glob.glob(os.path.join(args.dir, "**", "*.md"), recursive=True)
    elif args.target:
        if any(char in args.target for char in ["*", "?", "["]):
            files_to_check = glob.glob(args.target, recursive=True)
        else:
            files_to_check = [args.target]
    else:
        parser.print_help()
        sys.exit(1)

    if not files_to_check:
        print("[WARN] 검사할 대상 마크다운 파일이 없습니다.")
        sys.exit(0)

    total_count = len(files_to_check)
    fail_count = 0

    print(f"=== Obsidian Note Validator: {total_count}개 파일 검사 시작 ===")

    for fp in files_to_check:
        fname = os.path.basename(fp)
        is_ok, errs = validate_note(fp)
        if is_ok:
            print(f"[PASS] {fname}")
        else:
            fail_count += 1
            print(f"[FAIL] {fname} ({fp})")
            for e in errs:
                print(f"       -> {e}")

    print("==========================================================")
    if fail_count == 0:
        print(f"결과: 전수 통과! (총 {total_count}개 파일 이상 없음)")
        sys.exit(0)
    else:
        print(f"결과: 검증 실패! (총 {total_count}개 중 {fail_count}개 오류 발견)", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

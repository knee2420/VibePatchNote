"""마이그레이션 CLI.

    python -m migrations status
    python -m migrations migrate
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from . import MIGRATIONS, TARGET_VERSION, migrate, read_version

BASE_DIR = Path(__file__).resolve().parents[1]


def main() -> int:
    # Windows 콘솔 기본 코드페이지(cp949)에서 한글 로그가 깨지지 않게 한다.
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8", errors="replace")
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(prog="migrations", description="저장소 레이아웃 마이그레이션")
    parser.add_argument("command", choices=["status", "migrate"])
    parser.add_argument("--base-dir", type=Path, default=BASE_DIR)
    args = parser.parse_args()

    current = read_version(args.base_dir) or 0

    if args.command == "status":
        print(f"저장소: {args.base_dir}")
        print(f"현재 버전: {current} / 목표 버전: {TARGET_VERSION}")
        for migration in MIGRATIONS:
            mark = "적용됨" if migration.version <= current else "미적용"
            print(f"  v{migration.version} {migration.name} - {mark}")
        return 0

    applied = migrate(args.base_dir)
    if not applied:
        print(f"이미 최신입니다 (v{current}).")
        return 0
    print("적용 완료: " + ", ".join(applied))
    return 0


if __name__ == "__main__":
    sys.exit(main())

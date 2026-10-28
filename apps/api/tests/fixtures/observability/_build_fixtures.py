"""관측 픽스처 생성기.

픽스처는 **실제 생산자가 쓴 파일**이어야 한다. 손으로 지어낸 샘플은 생산자가
쓰지 않는 키(`status: "SUCCESS"`, `duration_ms`)를 담게 되고, 그러면 테스트가
통과하면서도 실제 데이터에서는 깨진다 — 실제로 `test_inspector.py` 가 그랬다.

그래서 이 스크립트는 진짜 `data/runs` 에서 복사하되, 커밋 가능한 크기로 만들기
위해 **긴 문자열 값만** 자른다. 키 이름·대소문자·구조·숫자는 건드리지 않는다.

사용법:

    python _build_fixtures.py --source /path/to/apps/api/data

`--source` 기본값은 이 저장소의 `apps/api/data` 다.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# 자를 기준. 이보다 긴 문자열 값만 축약한다.
MAX_STR = 300
KEEP = 200

# 복사할 run 디렉터리와 그 run 이 대표하는 상황.
RUNS = {
    "run-1a094630557-4e4f96ee": "full telemetry — meta + ledger + events 전부 있음",
    "run-contract-20260911-191719": "attempts 있음 — ModelAttemptRecord 계약 검증용",
    "agent-5a0846d55d53": "events.jsonl 만 있음 — meta 기준 목록에서는 보이지 않는 run",
}

RUN_FILES = ("meta.json", "ledger.jsonl", "events.jsonl", "snapshots.json", "input.json")


def shrink(value):
    """긴 문자열 값만 축약한다. 키·숫자·불리언·구조는 보존한다."""
    if isinstance(value, str):
        if len(value) > MAX_STR:
            return f"{value[:KEEP]}…[truncated {len(value) - KEEP} chars for fixture]"
        return value
    if isinstance(value, list):
        return [shrink(v) for v in value]
    if isinstance(value, dict):
        return {k: shrink(v) for k, v in value.items()}
    return value


def copy_json(src: Path, dst: Path) -> None:
    data = json.loads(src.read_text(encoding="utf-8"))
    dst.write_text(
        json.dumps(shrink(data), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def copy_jsonl(src: Path, dst: Path) -> None:
    out = []
    for line in src.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        out.append(json.dumps(shrink(json.loads(line)), ensure_ascii=False))
    dst.write_text("\n".join(out) + "\n", encoding="utf-8")


def sample_ledger(src: Path, dst: Path, per_schema: int = 4) -> None:
    """월별 원장에서 스키마 변종별로 몇 줄씩 뽑는다.

    이 파일에는 camelCase(구형)와 snake_case(신형)가 섞여 있다. 둘 다 남겨야
    마이그레이션 테스트가 실제 상황을 재현한다.
    """
    camel, snake = [], []
    for line in src.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        bucket = camel if "recordedAt" in row else snake
        if len(bucket) < per_schema:
            bucket.append(json.dumps(shrink(row), ensure_ascii=False))
    dst.write_text("\n".join(camel + snake) + "\n", encoding="utf-8")
    print(f"  ledger: camelCase {len(camel)}행 + snake_case {len(snake)}행")


def main() -> None:
    # Windows 콘솔 기본 코드페이지(cp949)는 이 파일의 한글·em dash 를 못 찍는다.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=HERE.parents[2] / "data",
        help="apps/api/data 경로",
    )
    args = parser.parse_args()
    source: Path = args.source.resolve()

    if not source.is_dir():
        raise SystemExit(f"source 없음: {source}")

    runs_out = HERE / "runs"
    if runs_out.exists():
        shutil.rmtree(runs_out)
    runs_out.mkdir(parents=True)

    for run_id, why in RUNS.items():
        src_dir = source / "runs" / run_id
        if not src_dir.is_dir():
            print(f"  건너뜀 (없음): {run_id}")
            continue
        dst_dir = runs_out / run_id
        dst_dir.mkdir()
        for name in RUN_FILES:
            src = src_dir / name
            if not src.exists():
                continue
            if name.endswith(".jsonl"):
                copy_jsonl(src, dst_dir / name)
            else:
                copy_json(src, dst_dir / name)
        print(f"  {run_id}: {why}")

    ledger_out = HERE / "ledger"
    ledger_out.mkdir(exist_ok=True)
    for src in sorted((source / "ledger").glob("*.jsonl")):
        sample_ledger(src, ledger_out / src.name)

    print("완료:", HERE)


if __name__ == "__main__":
    main()

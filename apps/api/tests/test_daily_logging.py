import logging
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

from app.core.logging_config import (
    DailyDirectoryFileHandler,
    purge_expired_logs,
    setup_logging,
)


def test_daily_directory_handler_creates_dated_folder(tmp_path: Path):
    base_logs = tmp_path / "logs"
    handler = DailyDirectoryFileHandler(
        base_dir=base_logs,
        relative_filename="app.log",
        formatter=logging.Formatter("%(message)s"),
    )
    test_logger = logging.getLogger("test.daily.basic")
    test_logger.setLevel(logging.INFO)
    test_logger.addHandler(handler)

    test_logger.info("Hello daily log")
    handler.flush()
    handler.close()

    today_str = datetime.now().strftime("%Y-%m-%d")
    expected_file = base_logs / today_str / "app.log"
    assert expected_file.exists()
    assert "Hello daily log" in expected_file.read_text(encoding="utf-8")


def test_daily_directory_handler_rollover_on_date_change(tmp_path: Path):
    base_logs = tmp_path / "logs"
    handler = DailyDirectoryFileHandler(
        base_dir=base_logs,
        relative_filename="debug.log",
        formatter=logging.Formatter("%(message)s"),
    )
    test_logger = logging.getLogger("test.daily.rollover")
    test_logger.setLevel(logging.INFO)
    test_logger.addHandler(handler)

    # 1. Day 1
    with patch.object(handler, "_get_today_str", return_value="2026-09-13"):
        test_logger.info("Day 1 entry")
        handler.flush()

    day1_file = base_logs / "2026-09-13" / "debug.log"
    assert day1_file.exists()
    assert "Day 1 entry" in day1_file.read_text(encoding="utf-8")

    # 2. Day 2 (자정 경과 시뮬레이션)
    with patch.object(handler, "_get_today_str", return_value="2026-09-14"):
        test_logger.info("Day 2 entry")
        handler.flush()

    day2_file = base_logs / "2026-09-14" / "debug.log"
    assert day2_file.exists()
    assert "Day 2 entry" in day2_file.read_text(encoding="utf-8")

    # Day 1 파일에는 Day 2 로그가 섞이지 않음
    assert "Day 2 entry" not in day1_file.read_text(encoding="utf-8")

    handler.close()


def test_purge_expired_logs(tmp_path: Path):
    base_logs = tmp_path / "logs"
    base_logs.mkdir(parents=True, exist_ok=True)

    today = datetime.now().date()
    expired_date = today - timedelta(days=20)
    fresh_date = today - timedelta(days=2)

    expired_dir = base_logs / expired_date.strftime("%Y-%m-%d")
    fresh_dir = base_logs / fresh_date.strftime("%Y-%m-%d")
    non_date_dir = base_logs / "traces"

    expired_dir.mkdir()
    (expired_dir / "app.log").write_text("old", encoding="utf-8")
    fresh_dir.mkdir()
    (fresh_dir / "app.log").write_text("recent", encoding="utf-8")
    non_date_dir.mkdir()

    purged = purge_expired_logs(base_logs, retention_days=14)
    assert purged == 1
    assert not expired_dir.exists()
    assert fresh_dir.exists()
    assert non_date_dir.exists()


def test_setup_logging_integrates_daily_structure(tmp_path: Path):
    base_logs = tmp_path / "test_state_logs"
    setup_logging(base_logs)

    app_logger = logging.getLogger("vibe.api")
    app_logger.info("Startup test log")

    engine_logger = logging.getLogger("scaffold_engine")
    engine_logger.info("Engine test log")

    today_str = datetime.now().strftime("%Y-%m-%d")
    today_dir = base_logs / today_str

    assert today_dir.exists()
    assert (today_dir / "app.log").exists()
    assert (today_dir / "debug.log").exists()
    assert (today_dir / "engines" / "scaffold_engine.log").exists()

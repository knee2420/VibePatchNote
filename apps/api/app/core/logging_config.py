"""
엔진별/서버별 일별 디렉터리 분리 로깅 구성기.
FastAPI 앱, 도메인 엔진(scaffold_engine), 그리고 통합 디버그 스트림을 날짜별 폴더(`state/log/{YYYY-MM-DD}/`)로 분리하여 기록합니다.

로그는 `state/log/` 에 둔다. 지워도 앱이 정상 동작해야 하는 자료이고, 실제로
보존기간이 지나면 지운다. 위치를 아는 것은 저장 게이트뿐이다.
"""
from __future__ import annotations

import logging
import re
import shutil
import sys
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, TextIO

_LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] %(message)s"
_DATE_DIR_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class DailyDirectoryFileHandler(logging.Handler):
    """일별 디렉터리(`state/log/{YYYY-MM-DD}/...`)로 로그 파일을 기록 및 자동 롤오버하는 핸들러.

    - 날짜별 폴더 아래에 대상 로그 파일(app.log, debug.log, engines/scaffold_engine.log)을 생성합니다.
    - 서버가 장시간 켜져 있어 자정을 넘기더라도, 날짜 변경을 감지하여 안전하게 다음 날짜 디렉터리로 스트림을 전환합니다.
    - 파일 rename이 없으므로 Windows 환경에서의 파일 락(WinError 32) 충돌이 원천 방지됩니다.
    """

    def __init__(
        self,
        base_dir: Path,
        relative_filename: str | Path,
        encoding: str = "utf-8",
        formatter: Optional[logging.Formatter] = None,
    ) -> None:
        super().__init__()
        self.base_dir = Path(base_dir)
        self.relative_filename = Path(relative_filename)
        self.encoding = encoding
        if formatter:
            self.setFormatter(formatter)

        self._current_date_str: Optional[str] = None
        self._stream: Optional[TextIO] = None
        self._current_filepath: Optional[Path] = None
        self._lock = threading.RLock()
        self.handler_id = (str(self.base_dir.resolve()), str(self.relative_filename))

    def _get_today_str(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def _ensure_stream(self) -> TextIO:
        today = self._get_today_str()
        if self._stream is None or today != self._current_date_str:
            if self._stream is not None:
                try:
                    self._stream.flush()
                    self._stream.close()
                except Exception:
                    pass
                self._stream = None

            self._current_date_str = today
            target_file = self.base_dir / today / self.relative_filename
            target_file.parent.mkdir(parents=True, exist_ok=True)
            self._current_filepath = target_file
            self._stream = open(target_file, mode="a", encoding=self.encoding)

        return self._stream

    def emit(self, record: logging.LogRecord) -> None:
        with self._lock:
            try:
                stream = self._ensure_stream()
                msg = self.format(record)
                stream.write(msg + "\n")
                stream.flush()
            except Exception:
                self.handleError(record)

    def flush(self) -> None:
        with self._lock:
            if self._stream is not None:
                try:
                    self._stream.flush()
                except Exception:
                    pass

    def close(self) -> None:
        with self._lock:
            if self._stream is not None:
                try:
                    self._stream.flush()
                    self._stream.close()
                except Exception:
                    pass
                self._stream = None
            super().close()


def _migrate_legacy_flat_logs(base_logs_dir: Path) -> None:
    """이전 단일 파일 구조(`state/log/app.log` 등)를 해당 파일의 최종 수정일 디렉터리로 안전 이동."""
    flat_targets = [
        base_logs_dir / "app.log",
        base_logs_dir / "debug.log",
        base_logs_dir / "engines" / "scaffold_engine.log",
    ]
    for target in flat_targets:
        if target.is_file() and target.stat().st_size > 0:
            try:
                mtime = datetime.fromtimestamp(target.stat().st_mtime)
                date_str = mtime.strftime("%Y-%m-%d")
                rel_parent = target.parent.relative_to(base_logs_dir)
                dest_dir = base_logs_dir / date_str / rel_parent
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_file = dest_dir / target.name
                if not dest_file.exists():
                    shutil.move(str(target), str(dest_file))
                else:
                    legacy_name = f"{target.stem}_legacy_{int(mtime.timestamp())}{target.suffix}"
                    shutil.move(str(target), str(dest_dir / legacy_name))
            except Exception:
                # 실행 중인 프로세스가 파일을 잠근 경우 안전하게 스킵
                pass


def purge_expired_logs(base_logs_dir: Path, retention_days: int = 14) -> int:
    """보존 기한이 지난 일별 로그 디렉터리(`state/log/{YYYY-MM-DD}`)를 정리합니다."""
    if not base_logs_dir.exists():
        return 0

    cutoff_date = (datetime.now() - timedelta(days=retention_days)).date()
    purged_count = 0

    for item in base_logs_dir.iterdir():
        if item.is_dir() and _DATE_DIR_PATTERN.match(item.name):
            try:
                dir_date = datetime.strptime(item.name, "%Y-%m-%d").date()
                if dir_date < cutoff_date:
                    shutil.rmtree(item, ignore_errors=True)
                    purged_count += 1
            except ValueError:
                continue

    return purged_count


def setup_logging(base_logs_dir: Optional[Path] = None) -> Path:
    """
    다중 타깃 일별 분할 로깅 시스템을 초기화합니다.
    - state/log/{YYYY-MM-DD}/app.log: API 웹 서버 및 라우터 요청
    - state/log/{YYYY-MM-DD}/debug.log: 전체 통합 스트림
    - state/log/{YYYY-MM-DD}/engines/scaffold_engine.log: scaffold-engine 파이프라인 및 하네스 로그
    - state/log/traces/runs/{YYYY-MM-DD}/: 정밀 추적 디렉터리
    """
    if base_logs_dir is None:
        from app.core.config import settings

        base_logs_dir = settings.storage.log

    base_logs_dir.mkdir(parents=True, exist_ok=True)
    traces_dir = base_logs_dir / "traces" / "runs"
    traces_dir.mkdir(parents=True, exist_ok=True)

    # 기존 단일 파일이 남아있으면 날짜 폴더로 마이그레이션
    _migrate_legacy_flat_logs(base_logs_dir)

    formatter = logging.Formatter(_LOG_FORMAT)

    def _attach_daily_handler(target: logging.Logger, relative_path: Path | str) -> None:
        handler_id = (str(base_logs_dir.resolve()), str(Path(relative_path)))
        if any(getattr(h, "handler_id", None) == handler_id for h in target.handlers):
            return
        handler = DailyDirectoryFileHandler(
            base_dir=base_logs_dir,
            relative_filename=relative_path,
            encoding="utf-8",
            formatter=formatter,
        )
        target.addHandler(handler)

    # 1. 루트 로거 기본 설정 (콘솔 + 일별 debug.log)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # 기존 콘솔 핸들러 중복 방지
    if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in root_logger.handlers):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    _attach_daily_handler(root_logger, "debug.log")

    # 2. API 앱 전용 파일 핸들러 (state/log/{YYYY-MM-DD}/app.log)
    for app_name in ("vibe.api", "app"):
        _attach_daily_handler(logging.getLogger(app_name), "app.log")

    # 3. scaffold-engine 전용 파일 핸들러 (state/log/{YYYY-MM-DD}/engines/scaffold_engine.log)
    _attach_daily_handler(
        logging.getLogger("scaffold_engine"), Path("engines") / "scaffold_engine.log"
    )

    return base_logs_dir

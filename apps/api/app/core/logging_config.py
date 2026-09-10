"""
엔진별/서버별 분리 로깅 구성기.
FastAPI 앱, 도메인 엔진(scaffold_engine), 그리고 통합 디버그 스트림을 분리하여 기록합니다.

로그는 `state/log/` 에 둔다. 지워도 앱이 정상 동작해야 하는 자료이고, 실제로
보존기간이 지나면 지운다. 위치를 아는 것은 저장 게이트뿐이다.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Optional

_LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] %(message)s"


def setup_logging(base_logs_dir: Optional[Path] = None) -> Path:
    """
    다중 타깃 로깅 시스템을 초기화합니다.
    - state/log/app.log: API 웹 서버 및 라우터 요청
    - state/log/debug.log: 전체 통합 스트림
    - state/log/engines/scaffold_engine.log: scaffold-engine 파이프라인 및 하네스 로그
    - state/log/traces/: 정밀 추적 디렉터리 준비
    """
    if base_logs_dir is None:
        from app.core.config import settings

        base_logs_dir = settings.storage.log

    engines_dir = base_logs_dir / "engines"
    traces_dir = base_logs_dir / "traces" / "runs"

    base_logs_dir.mkdir(parents=True, exist_ok=True)
    engines_dir.mkdir(parents=True, exist_ok=True)
    traces_dir.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(_LOG_FORMAT)

    def _attach_file_handler(target: logging.Logger, path: Path) -> None:
        """이미 같은 파일을 보는 핸들러가 있으면 새로 열지 않는다.

        핸들러 객체를 먼저 만들고 나중에 중복 검사를 하면, 추가되지 않은 핸들러가
        파일을 연 채로 남아 재호출마다 핸들이 샌다.
        """
        if any(getattr(h, "baseFilename", None) == str(path) for h in target.handlers):
            return
        handler = logging.FileHandler(str(path), encoding="utf-8", mode="a")
        handler.setFormatter(formatter)
        target.addHandler(handler)

    # 1. 루트 로거 기본 설정 (콘솔 + debug.log)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # 기존 핸들러 중복 방지
    if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in root_logger.handlers):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    _attach_file_handler(root_logger, base_logs_dir / "debug.log")

    # 2. API 앱 전용 파일 핸들러 (logs/app.log)
    app_file = base_logs_dir / "app.log"
    for app_name in ("vibe.api", "app"):
        _attach_file_handler(logging.getLogger(app_name), app_file)

    # 3. scaffold-engine 전용 파일 핸들러 (logs/engines/scaffold_engine.log)
    _attach_file_handler(
        logging.getLogger("scaffold_engine"), engines_dir / "scaffold_engine.log"
    )

    return base_logs_dir

"""
엔진별/서버별 분리 로깅 구성기.
FastAPI 앱, 도메인 엔진(scaffold_engine), 그리고 통합 디버그 스트림을 분리하여 기록합니다.
"""
from __future__ import annotations

import logging
from pathlib import Path
import sys
from typing import Optional

_LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] %(message)s"


def setup_logging(base_logs_dir: Optional[Path] = None) -> Path:
    """
    다중 타깃 로깅 시스템을 초기화합니다.
    - logs/app.log: API 웹 서버 및 라우터 요청
    - logs/debug.log: 전체 통합 스트림 (기존 호환성 유지)
    - logs/engines/scaffold_engine.log: scaffold-engine 파이프라인 및 하네스 로그
    - logs/traces/: LangSmith 스타일 정밀 추적 디렉터리 준비
    """
    if base_logs_dir is None:
        # apps/api/logs
        base_logs_dir = Path(__file__).resolve().parents[2] / "logs"

    engines_dir = base_logs_dir / "engines"
    traces_dir = base_logs_dir / "traces" / "runs"

    base_logs_dir.mkdir(parents=True, exist_ok=True)
    engines_dir.mkdir(parents=True, exist_ok=True)
    traces_dir.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(_LOG_FORMAT)

    # 1. 루트 로거 기본 설정 (콘솔 + debug.log)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # 기존 핸들러 중복 방지
    if not any(isinstance(h, logging.StreamHandler) and h.stream == sys.stdout for h in root_logger.handlers):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    debug_file = base_logs_dir / "debug.log"
    if not any(getattr(h, "baseFilename", None) == str(debug_file) for h in root_logger.handlers):
        debug_handler = logging.FileHandler(str(debug_file), encoding="utf-8", mode="a")
        debug_handler.setFormatter(formatter)
        root_logger.addHandler(debug_handler)

    # 2. API 앱 전용 파일 핸들러 (logs/app.log)
    app_file = base_logs_dir / "app.log"
    app_handler = logging.FileHandler(str(app_file), encoding="utf-8", mode="a")
    app_handler.setFormatter(formatter)

    for app_name in ("vibe.api", "app"):
        l = logging.getLogger(app_name)
        if not any(getattr(h, "baseFilename", None) == str(app_file) for h in l.handlers):
            l.addHandler(app_handler)

    # 3. scaffold-engine 전용 파일 핸들러 (logs/engines/scaffold_engine.log)
    scaffold_file = engines_dir / "scaffold_engine.log"
    scaffold_handler = logging.FileHandler(str(scaffold_file), encoding="utf-8", mode="a")
    scaffold_handler.setFormatter(formatter)

    engine_logger = logging.getLogger("scaffold_engine")
    if not any(getattr(h, "baseFilename", None) == str(scaffold_file) for h in engine_logger.handlers):
        engine_logger.addHandler(scaffold_handler)

    return base_logs_dir

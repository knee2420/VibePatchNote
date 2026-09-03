"""
애플리케이션 전역 설정 (SSOT).

경로/외부 노출 URL/CORS 허용치를 이 모듈 한 곳에서만 정의합니다.
각 도메인 서비스가 상대 경로나 호스트를 직접 하드코딩하는 것을 금지합니다.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import List

# apps/api 디렉터리. 실행 위치(CWD)와 무관하게 항상 같은 곳을 가리킵니다.
BASE_DIR = Path(__file__).resolve().parents[2]

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


class Settings:
    """환경 변수로 덮어쓸 수 있는 런타임 설정."""

    def __init__(self) -> None:
        self.base_dir: Path = BASE_DIR
        self.upload_dir: Path = Path(os.getenv("VIBE_UPLOAD_DIR", str(BASE_DIR / "uploads")))
        self.db_file: Path = Path(os.getenv("VIBE_DB_FILE", str(BASE_DIR / "workspaces_db.json")))
        # 업로드 파일을 프런트엔드에 돌려줄 때 사용할 외부 노출 오리진.
        self.public_base_url: str = os.getenv("VIBE_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
        self.cors_origins: List[str] = self._read_cors_origins()

    @staticmethod
    def _read_cors_origins() -> List[str]:
        raw = os.getenv("VIBE_CORS_ORIGINS")
        if not raw:
            return list(_DEFAULT_CORS_ORIGINS)
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def ensure_directories(self) -> None:
        self.upload_dir.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

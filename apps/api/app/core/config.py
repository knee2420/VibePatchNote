"""
애플리케이션 전역 설정 (SSOT).

외부 노출 URL·CORS 허용치·에이전트 CLI 실행 파라미터를 이 모듈 한 곳에서만 정의합니다.
각 도메인 서비스나 워크플로우 노드가 호스트·모델명·타임아웃을 직접 하드코딩하는 것을
금지합니다.

**저장 경로는 여기에 두지 않습니다.** 경로를 전역으로 공개하면 누구나 어댑터를
건너뛰고 디스크에 직접 쓸 수 있고, 실제로 그렇게 되었습니다. 경로를 아는 것은
`app.core.storage.StorageRoots` 와 각 도메인 어댑터뿐입니다.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import dotenv_values

from app.core.storage import StorageRoots

# apps/api 디렉터리. 실행 위치(CWD)와 무관하게 항상 같은 곳을 가리킵니다.
BASE_DIR = Path(__file__).resolve().parents[2]

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

_DEFAULT_AGENT_CLI_BIN = "agy"
_DEFAULT_AGENT_CLI_MODEL = "gemini-3.8-flash-low"
_DEFAULT_AGENT_CLI_TIMEOUT_SECONDS = 180
_DEFAULT_GOOGLE_API_MODEL = "gemini-3.5-flash-lite"
_DEFAULT_PRIMARY_PROVIDER = "agy_cli"
_DEFAULT_FALLBACK_PROVIDER = "google_api"


def _optional_path(key: str) -> Path | None:
    raw = os.getenv(key)
    return Path(raw) if raw else None


class Settings:
    """환경 변수로 덮어쓸 수 있는 런타임 설정."""

    def __init__(self) -> None:
        self.base_dir: Path = BASE_DIR

        # 저장 등급 루트. 개별 파일 경로는 어댑터가 이 객체에서 파생시킵니다.
        self.storage: StorageRoots = StorageRoots(
            BASE_DIR,
            config_dir=_optional_path("VIBE_CONFIG_DIR"),
            data_dir=_optional_path("VIBE_DATA_DIR"),
            cache_dir=_optional_path("VIBE_CACHE_DIR"),
            state_dir=_optional_path("VIBE_STATE_DIR"),
        )

        # 업로드 파일을 프런트엔드에 돌려줄 때 사용할 외부 노출 오리진.
        self.public_base_url: str = os.getenv("VIBE_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
        self.cors_origins: List[str] = self._read_cors_origins()

        # --- 에이전트 CLI (Antigravity 하네스) 실행 파라미터 ---
        self.agent_cli_bin: str = os.getenv("VIBE_AGENT_CLI_BIN", _DEFAULT_AGENT_CLI_BIN)
        self.agent_cli_model: str = os.getenv("VIBE_AGENT_CLI_MODEL", _DEFAULT_AGENT_CLI_MODEL)
        self.agent_cli_timeout_seconds: int = self._read_int(
            "VIBE_AGENT_CLI_TIMEOUT_SECONDS", _DEFAULT_AGENT_CLI_TIMEOUT_SECONDS
        )
        # Google direct API fallback. 실제 비밀 값은 환경 설정 또는 OS 자격 증명 저장소에만 둔다.
        self.google_api_model: str = os.getenv("VIBE_GOOGLE_API_MODEL", _DEFAULT_GOOGLE_API_MODEL)
        self.google_api_timeout_seconds: int = self._read_int(
            "VIBE_GOOGLE_API_TIMEOUT_SECONDS", self.agent_cli_timeout_seconds
        )
        # 실행 엔진 라우팅 정책 (기본 실행 경로 vs 보조 fallback 경로)
        self.primary_provider: str = os.getenv("VIBE_PRIMARY_PROVIDER", _DEFAULT_PRIMARY_PROVIDER)
        self.fallback_provider: str = os.getenv("VIBE_FALLBACK_PROVIDER", _DEFAULT_FALLBACK_PROVIDER)
        # 개발 PC의 비밀이 아닌 OAuth 식별자. 사용자 토큰/시크릿은 이 파일에 두지 않는다.
        oauth_defaults = dotenv_values(BASE_DIR / ".env.oauth.local")
        self.google_oauth_client_id: str = os.getenv(
            "VIBE_GOOGLE_OAUTH_CLIENT_ID", oauth_defaults.get("VIBE_GOOGLE_OAUTH_CLIENT_ID") or ""
        )
        self.google_cloud_project_id: str = os.getenv(
            "VIBE_GOOGLE_CLOUD_PROJECT_ID", oauth_defaults.get("VIBE_GOOGLE_CLOUD_PROJECT_ID") or ""
        )
        self.google_cloud_project_number: str = os.getenv(
            "VIBE_GOOGLE_CLOUD_PROJECT_NUMBER", oauth_defaults.get("VIBE_GOOGLE_CLOUD_PROJECT_NUMBER") or ""
        )

        # --- 보존 정책 (수명주기 등급의 실행 수단) ---
        self.trace_retention_days: int = self._read_int("VIBE_TRACE_RETENTION_DAYS", 14)

    @staticmethod
    def _read_cors_origins() -> List[str]:
        raw = os.getenv("VIBE_CORS_ORIGINS")
        if not raw:
            return list(_DEFAULT_CORS_ORIGINS)
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @staticmethod
    def _read_int(key: str, fallback: int) -> int:
        raw = os.getenv(key)
        if not raw:
            return fallback
        try:
            return int(raw)
        except ValueError:
            return fallback

    def ensure_directories(self) -> None:
        self.storage.ensure()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

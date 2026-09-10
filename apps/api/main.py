"""Document Builder Backend Harness 진입점 (FastAPI)."""
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# 모노레포 패키지(packages/scaffold-engine 등) 자동 로드 보장
_PACKAGES_DIR = Path(__file__).resolve().parents[2] / "packages"
if str(_PACKAGES_DIR / "scaffold-engine") not in sys.path:
    sys.path.insert(0, str(_PACKAGES_DIR / "scaffold-engine"))

from app.core.config import settings
from app.core.logging_config import setup_logging

# 로그 파일도 state/ 아래에 놓이므로 등급 디렉터리를 먼저 만든다.
settings.ensure_directories()
_LOGS_DIR = setup_logging()
logger = logging.getLogger("vibe.api")
logger.info("================ MULTI-TARGET LOGGING INITIALIZED ================")
logger.info("Base logs directory: %s", _LOGS_DIR)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.bootstrap.container import Container
from app.core.llm import purge_expired_traces
from app.core.storage import STORAGE_VERSION
from app.documents import router as documents_router
from app.llm_settings import router as llm_settings_router
from app.scaffolds import router as scaffolds_router
from app.workspaces import router as workspaces_router


class StorageVersionError(RuntimeError):
    """저장소 레이아웃이 코드와 맞지 않을 때. 조용히 변환하지 않는다."""


def verify_storage_version() -> None:
    """부팅 시 저장소 레이아웃 버전을 확인한다.

    맞지 않으면 **거부하고 명령을 안내한다.** 읽는 김에 조용히 변환하는 방식은
    언제 끝나는지 아무도 모르고 폴백 코드가 영구히 남는다. 마이그레이션은
    명시적으로, 한 번, 사람이 실행한다.
    """
    storage = settings.storage
    current = storage.read_version()

    if current == STORAGE_VERSION:
        return

    if current is None and storage.is_empty():
        # 새 설치다. 변환할 것이 없으므로 현재 버전으로 표시하고 시작한다.
        storage.write_version(STORAGE_VERSION)
        logger.info("[Storage] 새 저장소를 v%d 로 초기화했습니다.", STORAGE_VERSION)
        return

    raise StorageVersionError(
        f"저장소 레이아웃 버전이 맞지 않습니다 (디스크={current}, 코드={STORAGE_VERSION}).\n"
        f"다음 명령으로 마이그레이션한 뒤 다시 실행하십시오:\n"
        f"    python -m migrations migrate"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """부팅 복구와 보존정책 집행.

    - 끊긴 실행 정리: 프로세스와 함께 사라진 run 이 영원히 "분석 중"으로 남지 않게 한다.
    - 만료 트레이스 정리: 앱이 요청마다 파일을 회전시키는 대신 여기서 일괄 처리한다.
    """
    runtime = app.container.agent_runtime()
    swept = runtime.sweep_orphans()
    if swept:
        logger.warning("[Startup] 끊긴 실행 %d건을 실패로 정리했습니다.", len(swept))

    purged = purge_expired_traces(settings.trace_retention_days)
    if purged:
        logger.info("[Startup] 만료 트레이스 %d일치를 정리했습니다.", purged)

    yield


verify_storage_version()

app = FastAPI(
    title="Document Builder Backend Harness",
    description="FastAPI Orchestrator for the Agent Runtime Pipeline",
    version="0.1.0",
    lifespan=lifespan,
)

# 객체 그래프는 Container 한 곳에서 조립하고, 라우터에서만 FastAPI 의존성으로 꺼낸다.
container = Container()
container.wire(modules=[documents_router, scaffolds_router, workspaces_router, llm_settings_router])
app.container = container


# 모든 HTTP 요청/응답을 파일에 기록하는 추적 미들웨어
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    import time
    start_time = time.time()
    method = request.method
    # OAuth code, reset token 등 쿼리 문자열에는 비밀이 들어갈 수 있으므로 기록하지 않는다.
    url = request.url.path
    logger.info("[HTTP IN] %s %s", method, url)
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info("[HTTP OUT] %s %s -> Status %d (%sms)", method, url, response.status_code, duration_ms)
        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.exception("[HTTP ERROR] %s %s failed after %sms: %s", method, url, duration_ms, exc)
        raise


# CORS: 허용 오리진은 app/core/config.py 에서 관리합니다. (VIBE_CORS_ORIGINS 로 확장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """500 예외 발생 시에도 CORS 헤더가 포함된 명확한 JSON 에러를 반환합니다."""
    logger.exception("Unhandled server error: %s", exc)
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin if origin in settings.cors_origins else "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )


app.include_router(documents_router.router, prefix="/api/v1/documents", tags=["Documents & Agents"])
app.include_router(llm_settings_router.router, prefix="/api/v1/llm-settings", tags=["LLM Settings"])
app.include_router(scaffolds_router.router, prefix="/api/v1/scaffolds", tags=["Scaffolds & Vision Archives"])
app.include_router(workspaces_router.router, prefix="/api/v1/workspaces", tags=["Workspaces & Sessions"])


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "Document Builder Backend Harness"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

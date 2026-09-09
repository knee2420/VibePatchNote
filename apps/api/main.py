"""Document Builder Backend Harness 진입점 (FastAPI)."""
import logging
import sys
from pathlib import Path

# 모노레포 패키지(packages/scaffold-engine 등) 자동 로드 보장
_PACKAGES_DIR = Path(__file__).resolve().parents[2] / "packages"
if str(_PACKAGES_DIR / "scaffold-engine") not in sys.path:
    sys.path.insert(0, str(_PACKAGES_DIR / "scaffold-engine"))

from app.core.logging_config import setup_logging

_LOGS_DIR = setup_logging()
logger = logging.getLogger("vibe.api")
logger.info("================ MULTI-TARGET LOGGING INITIALIZED ================")
logger.info("Base logs directory: %s", _LOGS_DIR)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.bootstrap.container import Container
from app.core.config import settings
from app.documents import router as documents_router
from app.scaffolds import router as scaffolds_router
from app.workspaces import router as workspaces_router

app = FastAPI(
    title="Document Builder Backend Harness",
    description="FastAPI Orchestrator for the Native Workflow Pipeline",
    version="0.1.0",
)

# 객체 그래프는 Container 한 곳에서 조립하고, 라우터에서만 FastAPI 의존성으로 꺼낸다.
container = Container()
container.wire(modules=[documents_router, scaffolds_router, workspaces_router])
app.container = container

# 모든 HTTP 요청/응답을 파일에 기록하는 추적 미들웨어
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    import time
    start_time = time.time()
    method = request.method
    url = str(request.url)
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

app.include_router(documents_router.router, prefix="/api/v1/documents", tags=["Upload & Analyze"])
app.include_router(scaffolds_router.router, prefix="/api/v1/scaffolds", tags=["Scaffolds & Vision Archives"])
app.include_router(workspaces_router.router, prefix="/api/v1/workspaces", tags=["Workspaces & Sessions"])


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "Document Builder Backend Harness"}


if __name__ == "__main__":
    import uvicorn

    settings.ensure_directories()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

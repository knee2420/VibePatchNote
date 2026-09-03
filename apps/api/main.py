"""Document Builder Backend Harness 진입점."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.documents import router as documents_router
from app.hitl import router as hitl_router
from app.templates import router as templates_router
from app.workspaces import router as workspaces_router

app = FastAPI(
    title="Document Builder Backend Harness",
    description="FastAPI Orchestrator for the Native Workflow Pipeline",
    version="0.1.0",
)

# CORS: 허용 오리진은 app/core/config.py 에서 관리합니다. (VIBE_CORS_ORIGINS 로 확장)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router.router, prefix="/api/v1/documents", tags=["Upload & Analyze"])
app.include_router(hitl_router.router, prefix="/api/v1/hitl", tags=["Human-in-the-Loop"])
app.include_router(templates_router.router, prefix="/api/v1/templates", tags=["Templates & Assets"])
app.include_router(workspaces_router.router, prefix="/api/v1/workspaces", tags=["Workspaces & Sessions"])


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "Document Builder Backend Harness"}


if __name__ == "__main__":
    import uvicorn

    settings.ensure_directories()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.documents import router as upload_router
from app.rag import router as hitl_router
from app.templates import router as templates_router
from app.workspaces import router as workspaces_router

app = FastAPI(
    title="Document Builder Backend Harness",
    description="FastAPI Orchestrator for Dify + Antigravity Pipeline",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload_router.router, prefix="/api/v1/documents", tags=["Upload & Analyze"])
app.include_router(hitl_router.router, prefix="/api/v1/hitl", tags=["Human-in-the-Loop"])
app.include_router(templates_router.router, prefix="/api/v1/templates", tags=["Templates & Assets"])
app.include_router(workspaces_router.router, prefix="/api/v1/workspaces", tags=["Workspaces & Sessions"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Document Builder Backend Harness"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

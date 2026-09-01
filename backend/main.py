from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VibePatchNote API",
    description="Backend API for VibePatchNote application",
    version="0.1.0",
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to VibePatchNote API"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "VibePatchNote Backend"}

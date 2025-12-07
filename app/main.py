from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="SHT Asset Generator API",
    description="AI-powered asset generation for SuperHero Tactics",
    version="1.0.0"
)

# CORS - allow local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
static_path = Path(__file__).parent.parent / "static"
frontend_path = Path(__file__).parent.parent / "frontend"

if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

if frontend_path.exists():
    app.mount("/ui", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "SHT Asset Generator API",
        "version": "1.0.0",
        "ui": "/ui/index.html",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

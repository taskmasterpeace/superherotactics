from fastapi import APIRouter

from app.api.v1.endpoints import health, sounds

api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["health"])

# Sound effects
api_router.include_router(sounds.router, prefix="/sounds", tags=["sounds"])

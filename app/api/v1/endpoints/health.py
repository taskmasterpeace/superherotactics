from fastapi import APIRouter
from datetime import datetime

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check API health and configuration status."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "config": {
            "elevenlabs_configured": bool(settings.elevenlabs_api_key),
            "replicate_configured": bool(settings.replicate_api_token),
            "output_dir": str(settings.approved_output_dir),
            "pending_dir": str(settings.pending_dir)
        }
    }


@router.get("/status")
async def api_status():
    """Get detailed API status including available features."""
    return {
        "api_version": "1.0.0",
        "features": {
            "sounds": {
                "enabled": bool(settings.elevenlabs_api_key),
                "provider": "11Labs"
            },
            "images": {
                "enabled": bool(settings.replicate_api_token),
                "provider": "Replicate.ai"
            },
            "sprites": {
                "enabled": True,
                "provider": "local"
            }
        },
        "defaults": {
            "background_color": settings.default_background_color,
            "tolerance": settings.default_tolerance,
            "target_size": settings.default_target_size,
            "aspect_ratio": settings.default_aspect_ratio
        }
    }

from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ThenStep Backend API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "integrations": {
            "nominatim": "active",
            "osrm": "active",
            "overpass": "active",
            "ollama": settings.OLLAMA_BASE_URL,
            "openweather": "configured" if settings.OPENWEATHER_API_KEY else "disabled (optional)",
        },
    }

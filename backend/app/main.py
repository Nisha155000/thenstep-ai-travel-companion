from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db
from app.api import (
    health,
    locations,
    routes,
    journey,
    places,
    assistant,
    preferences,
    saved_journeys,
    weather,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title="ThenStep — Smart Travel Companion API",
    description="Backend API powering ThenStep: India-wide multi-modal route planning, interview buffer calculator, nearby facility discovery, and AI travel assistance.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal server error occurred while processing your travel request.",
            "detail": str(exc),
        },
    )

# Include all API Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(routes.router, prefix="/api")
app.include_router(journey.router, prefix="/api")
app.include_router(places.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")
app.include_router(preferences.router, prefix="/api")
app.include_router(saved_journeys.router, prefix="/api")
app.include_router(weather.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "ThenStep — AI-Powered Smart Travel Companion",
        "tagline": "One journey. One smart plan. Every next step made easier.",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }

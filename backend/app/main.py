from datetime import UTC, datetime

from backend.app.core.config import settings
from backend.app.core.cors import setup_cors
from backend.app.routers.itineraries import router as itineraries_router
from backend.app.routers.preferences import router as preferences_router
from backend.app.routers.recommendations import router as recommendations_router
from backend.app.routers.trips import router as trips_router
from fastapi import FastAPI

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI-powered travel itinerary planner tailored for India.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS middleware
setup_cors(app)

# Include API routers
app.include_router(preferences_router, prefix=settings.API_V1_STR)
app.include_router(recommendations_router, prefix=settings.API_V1_STR)
app.include_router(itineraries_router, prefix=settings.API_V1_STR)
app.include_router(trips_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint verifying service status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(UTC).isoformat(),
        "llm_provider": settings.LLM_PROVIDER,
        "llm_key_configured": bool(settings.LLM_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY),
    }


@app.get("/", tags=["System"])
async def root():
    """Root status summary."""
    return {
        "message": "Personalized Travel Itinerary Planner API is operational.",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION,
    }

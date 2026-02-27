"""Main FastAPI application entry point."""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings, Settings
from routers import webrtc, snapshot, gallery, spatial, privacy, generation

# Validate configuration
Settings.validate()

# Configure logging with production-safe settings
log_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('architectural_alchemist.log')
    ]
)
logger = logging.getLogger("architectural_alchemist")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Architectural Alchemist API",
    description="AI-powered architectural transformation platform",
    version="1.0.0"
)

# Add rate limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware with production-safe settings
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://your-frontend-domain.com",  # Replace with actual deployed domain
    "https://www.your-frontend-domain.com"
]

if os.getenv("ENVIRONMENT") == "production":
    # In production, only allow specific domains
    allowed_origins = [
        "https://your-frontend-domain.com",
        "https://www.your-frontend-domain.com"
    ]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)

# Include routers
app.include_router(webrtc.router)
app.include_router(snapshot.router)
app.include_router(gallery.router)
app.include_router(spatial.router)
app.include_router(privacy.router)
app.include_router(generation.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Architectural Alchemist API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "project_id": settings.PROJECT_ID}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""Main FastAPI application entry point."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings, Settings
from routers import webrtc, snapshot, gallery, spatial, privacy

# Validate configuration
Settings.validate()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("architectural_alchemist")

# Create FastAPI app
app = FastAPI(
    title="Architectural Alchemist API",
    description="AI-powered architectural transformation platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Include routers
app.include_router(webrtc.router)
app.include_router(snapshot.router)
app.include_router(gallery.router)
app.include_router(spatial.router)
app.include_router(privacy.router)


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
    uvicorn.run(app, host="0.0.0.0", port=8080)

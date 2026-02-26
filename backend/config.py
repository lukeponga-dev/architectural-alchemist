import os
from dotenv import load_dotenv
from typing import Optional

# Load .env file (must be before any os.getenv calls)
load_dotenv()


class Settings:
    """Application configuration and environment variables."""
    
    # API Keys
    GEMINI_KEY: str = os.getenv("GEMINI_LIVE_API_KEY")
    
    # GCP Configuration
    PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "gemini-live-agent-devpost")
    SNAPSHOT_BUCKET: str = os.getenv("SNAPSHOT_BUCKET", "incoming_photos")
    FIRESTORE_COLLECTION: str = os.getenv("FIRESTORE_COLLECTION", "architectural_snapshots")
    GOOGLE_SERVICE_ACCOUNT_EMAIL: Optional[str] = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    
    # Application Settings
    DEFAULT_APP_ID: str = "default_app_id"
    DEFAULT_USER_ID: str = "anonymous_user"
    MAX_FACE_COUNT: int = 3
    BLUR_RADIUS: int = 15
    IMAGE_QUALITY: int = 80
    SIGNED_URL_EXPIRATION_MINUTES: int = 15
    
    # Media Processing
    AUDIO_SAMPLE_RATE: int = 16000
    VIDEO_FPS: int = 1
    FRAME_TIMEOUT_SECONDS: float = 0.5
    
    # API Model Configuration
    GEMINI_MODEL: str = "models/gemini-1.5-flash-8b-exp-0827"
    GEMINI_PRO_MODEL: str = "gemini-1.5-pro"
    
    @classmethod
    def validate(cls) -> None:
        """Validate required environment variables."""
        if not cls.GEMINI_KEY:
            raise ValueError("GEMINI_LIVE_API_KEY environment variable is required")


# Global settings instance
settings = Settings()

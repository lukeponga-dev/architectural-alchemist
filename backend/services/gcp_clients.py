"""Google Cloud Platform client management and initialization."""

import google.genai as genai
import google.cloud.vision as vision
from google.cloud import storage
from google.cloud import firestore
from typing import Optional

from config import settings


class GCPClientManager:
    """Lazy-initialized GCP clients to avoid startup failures if credentials are missing."""
    
    def __init__(self):
        self._storage_client: Optional[storage.Client] = None
        self._firestore_client: Optional[firestore.Client] = None
        self._vision_client: Optional[vision.ImageAnnotatorClient] = None
        self._spatial_model = None
    
    def get_storage_client(self) -> storage.Client:
        """Get or create Google Cloud Storage client."""
        if self._storage_client is None:
            self._storage_client = storage.Client(project=settings.PROJECT_ID)
        return self._storage_client
    
    def get_firestore_client(self) -> firestore.Client:
        """Get or create Firestore client."""
        if self._firestore_client is None:
            self._firestore_client = firestore.Client(project=settings.PROJECT_ID)
        return self._firestore_client
    
    def get_vision_client(self) -> vision.ImageAnnotatorClient:
        """Get or create Vision API client."""
        if self._vision_client is None:
            self._vision_client = vision.ImageAnnotatorClient()
        return self._vision_client
    
    def get_spatial_model(self):
        """Get or create Gemini Pro model for spatial analysis."""
        if self._spatial_model is None:
            genai.configure(api_key=settings.GEMINI_KEY)
            self._spatial_model = genai.GenerativeModel(settings.GEMINI_PRO_MODEL)
        return self._spatial_model


# Global client manager instance
gcp_clients = GCPClientManager()

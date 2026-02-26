"""
Privacy Shield - AUP Compliance Microservice
Detects human presence and applies privacy filters before processing
"""

import os
import base64
import io
from typing import Dict, Any
import numpy as np
from PIL import Image, ImageFilter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.cloud.vision as vision

app = FastAPI(title="Privacy Shield API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Cloud clients
vision_client = vision.ImageAnnotatorClient()

class FrameRequest(BaseModel):
    image_data: str  # Base64 encoded image
    frame_id: str
    timestamp: float

class FrameResponse(BaseModel):
    safe: bool
    processed_image: str  # Base64 encoded processed image
    human_detected: bool
    confidence: float
    blur_applied: bool

class PrivacyShield:
    """Privacy protection service for AUP compliance"""
    
    def __init__(self):
        self.blur_radius = 15
        self.detection_threshold = 0.7
        
    def detect_humans(self, image_content: bytes) -> Dict[str, Any]:
        """Detect human presence using Cloud Vision API"""
        try:
            image = vision.Image(content=image_content)
            
            # Use label detection for person detection
            response = vision_client.label_detection(image=image)
            labels = response.label_annotations
            
            # Use face detection for more precise human detection
            face_response = vision_client.face_detection(image=image)
            faces = face_response.face_annotations
            
            # Check for person labels
            person_confidence = 0.0
            for label in labels:
                if label.description.lower() in ['person', 'people', 'human', 'face']:
                    person_confidence = max(person_confidence, label.score)
            
            # Combine face detection confidence
            face_confidence = len(faces) > 0
            
            human_detected = (
                person_confidence > self.detection_threshold or 
                face_confidence
            )
            
            return {
                'human_detected': human_detected,
                'confidence': max(person_confidence, 1.0 if face_confidence else 0.0),
                'face_count': len(faces),
                'labels': [{'description': label.description, 'score': label.score} for label in labels]
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Vision API error: {str(e)}")
    
    def apply_privacy_filter(self, image: Image.Image, detection_result: Dict[str, Any]) -> Image.Image:
        """Apply Gaussian blur to regions with detected humans"""
        if not detection_result['human_detected']:
            return image
        
        # For simplicity, blur the entire image if humans are detected
        # In production, you'd want to blur only the detected regions
        blurred_image = image.filter(ImageFilter.GaussianBlur(radius=self.blur_radius))
        
        return blurred_image
    
    def process_frame(self, image_data: str) -> Dict[str, Any]:
        """Process a single frame for privacy compliance"""
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Detect humans
            detection_result = self.detect_humans(image_bytes)
            
            # Apply privacy filter if needed
            processed_image = self.apply_privacy_filter(image, detection_result)
            
            # Convert back to base64
            buffer = io.BytesIO()
            processed_image.save(buffer, format='JPEG')
            processed_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                'safe': not detection_result['human_detected'],
                'processed_image': processed_base64,
                'human_detected': detection_result['human_detected'],
                'confidence': detection_result['confidence'],
                'blur_applied': detection_result['human_detected']
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

# Initialize privacy shield
privacy_shield = PrivacyShield()

@app.post("/process-frame", response_model=FrameResponse)
async def process_frame(request: FrameRequest):
    """Process a frame for privacy compliance"""
    result = privacy_shield.process_frame(request.image_data)
    
    return FrameResponse(
        safe=result['safe'],
        processed_image=result['processed_image'],
        human_detected=result['human_detected'],
        confidence=result['confidence'],
        blur_applied=result['blur_applied']
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "privacy-shield"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Privacy Shield",
        "version": "1.0.0",
        "description": "AUP compliance microservice for Architectural Alchemist"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

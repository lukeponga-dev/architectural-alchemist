"""
Privacy Shield - AUP Compliance Microservice
Detects human presence and applies privacy filters before processing
"""

import os
import base64
import io
from typing import Dict, Any
from PIL import Image, ImageFilter, ImageDraw
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.cloud.vision as vision
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Privacy Shield API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Cloud Vision client
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

    def __init__(self, blur_radius: int = 15, detection_threshold: float = 0.7):
        self.blur_radius = blur_radius
        self.detection_threshold = detection_threshold

    def detect_humans(self, image_content: bytes) -> Dict[str, Any]:
        """Detect humans in an image using Cloud Vision"""
        try:
            image = vision.Image(content=image_content)
            labels_response = vision_client.label_detection(image=image)
            face_response = vision_client.face_detection(image=image)

            labels = labels_response.label_annotations
            faces = face_response.face_annotations

            # Label confidence
            person_confidence = max(
                (
                    label.score
                    for label in labels
                    if label.description.lower()
                    in ["person", "people", "human", "face"]
                ),
                default=0.0,
            )

            # Face detection boolean
            face_detected = len(faces) > 0

            human_detected = (
                person_confidence > self.detection_threshold or face_detected
            )

            confidence = max(person_confidence, 1.0 if face_detected else 0.0)

            return {
                "human_detected": human_detected,
                "confidence": confidence,
                "faces": faces,
                "labels": [
                    {"description": l.description, "score": l.score} for l in labels
                ],
            }

        except Exception as e:
            logging.error(f"Vision API error: {e}")
            raise HTTPException(status_code=500, detail=f"Vision API error: {str(e)}")

    def apply_privacy_filter(
        self, image: Image.Image, detection_result: Dict[str, Any]
    ) -> Image.Image:
        """
        Apply Gaussian blur to detected faces.
        Currently blurs the entire image if humans are detected as fallback.
        """
        faces = detection_result.get("faces", [])
        if not detection_result["human_detected"]:
            return image

        if faces:
            # Blur only face regions
            blurred = image.copy()
            for face in faces:
                # Bounding polygon of the face
                box = [(vertex.x, vertex.y) for vertex in face.bounding_poly.vertices]
                if len(box) >= 4:
                    min_x = min(v[0] for v in box)
                    min_y = min(v[1] for v in box)
                    max_x = max(v[0] for v in box)
                    max_y = max(v[1] for v in box)
                    region = blurred.crop((min_x, min_y, max_x, max_y))
                    region = region.filter(
                        ImageFilter.GaussianBlur(radius=self.blur_radius)
                    )
                    blurred.paste(region, (min_x, min_y))
            return blurred

        # Fallback: blur entire image
        return image.filter(ImageFilter.GaussianBlur(radius=self.blur_radius))

    def process_frame(self, image_data: str) -> Dict[str, Any]:
        """Process a single frame for privacy compliance"""
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            detection_result = self.detect_humans(image_bytes)
            processed_image = self.apply_privacy_filter(image, detection_result)

            # Encode processed image back to base64
            buffer = io.BytesIO()
            processed_image.save(buffer, format="JPEG")
            processed_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return {
                "safe": not detection_result["human_detected"],
                "processed_image": processed_base64,
                "human_detected": detection_result["human_detected"],
                "confidence": detection_result["confidence"],
                "blur_applied": detection_result["human_detected"],
            }

        except Exception as e:
            logging.error(f"Processing error: {e}")
            raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# Initialize privacy shield
privacy_shield = PrivacyShield()


@app.post("/process-frame", response_model=FrameResponse)
async def process_frame(request: FrameRequest):
    """Process a frame for privacy compliance"""
    result = privacy_shield.process_frame(request.image_data)
    return FrameResponse(**result)


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
        "description": "AUP compliance microservice for Architectural Alchemist",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)

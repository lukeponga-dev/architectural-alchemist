"""Privacy protection services for face detection and image blurring."""

import base64
import io
from typing import Tuple
from PIL import Image, ImageFilter

from config import settings
from services.gcp_clients import gcp_clients


class PrivacyShield:
    """Handles privacy protection through face detection and image blurring."""
    
    def __init__(self):
        self.vision_client = gcp_clients.get_vision_client()

    async def process_image(self, image: Image.Image) -> Image.Image:
        """Process image with privacy protection (blur faces if detected)."""
        # Convert image to bytes for Vision API
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="JPEG")
        
        # Detect faces
        vision_image = gcp_clients.get_vision_client().vision.Image(content=img_byte_arr.getvalue())
        response = self.vision_client.face_detection(image=vision_image)
        
        # Blur if faces detected
        if response.face_annotations:
            return image.filter(ImageFilter.GaussianBlur(settings.BLUR_RADIUS))
        
        return image

    async def process_base64_image(self, image_b64: str) -> Tuple[Image.Image, int]:
        """Process base64 image and return processed image with face count."""
        # Strip base64 header if present
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        
        # Decode image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Detect faces
        vision_image = gcp_clients.get_vision_client().vision.Image(content=image_bytes)
        response = self.vision_client.face_detection(image=vision_image)
        
        face_count = len(response.face_annotations)
        
        # Block crowd scenes
        if face_count > settings.MAX_FACE_COUNT:
            raise ValueError(f"Too many people detected ({face_count}) — snapshot blocked for privacy.")
        
        # Blur if any faces detected
        if face_count > 0:
            image = image.filter(ImageFilter.GaussianBlur(settings.BLUR_RADIUS))
        
        return image, face_count

    async def process_frame_for_frontend(self, image_b64: str) -> dict:
        """Process frame for frontend - returns blur status and processed image."""
        try:
            image_bytes = base64.b64decode(image_b64)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            vision_image = gcp_clients.get_vision_client().vision.Image(content=image_bytes)
            response = self.vision_client.face_detection(image=vision_image)

            blur_applied = False
            processed_b64 = image_b64

            if response.face_annotations:
                blur_applied = True
                image = image.filter(ImageFilter.GaussianBlur(settings.BLUR_RADIUS))

                # Encode back to base64
                buf = io.BytesIO()
                image.save(buf, format="JPEG", quality=70)
                processed_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

            return {
                "blur_applied": blur_applied,
                "processed_image": processed_b64,
                "face_count": len(response.face_annotations),
            }

        except Exception as e:
            raise Exception(f"Frame processing failed: {str(e)}")

"""Privacy protection API routes."""

import logging
from fastapi import APIRouter, Request, HTTPException

from services.privacy_shield import PrivacyShield

router = APIRouter(prefix="/process-frame", tags=["privacy"])
logger = logging.getLogger(__name__)

# Initialize services
privacy_shield = PrivacyShield()


@router.post("")
async def process_frame(request: Request):
    """Stand-alone privacy shield for frontend frame checking."""
    body = await request.json()
    image_b64 = body.get("image_data")

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    try:
        result = await privacy_shield.process_frame_for_frontend(image_b64)
        return result

    except Exception as e:
        logger.error(f"Frame processing failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Frame processing failed: {str(e)}"
        )

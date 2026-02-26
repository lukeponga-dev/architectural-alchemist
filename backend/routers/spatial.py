"""Spatial analysis API routes."""

import json
import re
import logging
from fastapi import APIRouter, Request, HTTPException

from config import settings
from services.gcp_clients import gcp_clients

router = APIRouter(prefix="/spatial", tags=["spatial"])
logger = logging.getLogger(__name__)


@router.post("")
async def spatial_analysis(request: Request):
    """Handle architectural spatial reasoning using Gemini Pro."""
    body = await request.json()
    image_b64 = body.get("image")
    analysis_type = body.get("type")

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    # Strip base64 header if present
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]

    try:
        # Prepare image for Gemini
        image_content = {"mime_type": "image/jpeg", "data": image_b64}

        if analysis_type == "analyze_room":
            prompt = """
                Analyze this room image for architectural transformation.
                Identify the following structural elements:
                1. Walls (main structural surfaces)
                2. Floor and ceiling
                3. Windows and doors
                
                For each element, provide:
                - Bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000)
                - Surface type
                - Material (e.g., concrete, wood, plaster)
                - Estimated confidence (0-1)
                
                Also estimate:
                - Room dimensions (width, height, depth in meters)
                - Camera position relative to the center of the room
                - Lighting quality (natural, artificial)
                
                Return ONLY a JSON object.
            """
        elif analysis_type == "identify_surface":
            x = body.get("x")
            y = body.get("y")
            width = body.get("width", 1280)
            height = body.get("height", 720)

            if x is None or y is None:
                raise HTTPException(
                    status_code=400, detail="Coordinates (x, y) are required"
                )

            # Convert pixel coordinates to normalized 0-1000 for Gemini
            norm_x = int((x / width) * 1000)
            norm_y = int((y / height) * 1000)

            prompt = f"""
                Identify the architectural surface at normalized coordinate [{norm_y}, {norm_x}].
                The image represents a room. Is this a wall, floor, ceiling, window, or door?
                
                Provide:
                1. The exact bounding box of the entire surface I am pointing at in [ymin, xmin, ymax, xmax] format.
                2. Its material and color.
                3. Why you believe this is the surface at that point.
                
                Return ONLY a JSON object with keys: "surface" (object with type, material, color, boundingBox), "confidence" (number), "reasoning" (string).
            """
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")

        response = gcp_clients.get_spatial_model().generate_content([prompt, image_content])
        text = response.text

        # Extract JSON from response
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise Exception("No JSON found in AI response")

        return json.loads(match.group())

    except Exception as e:
        logger.error(f"Spatial analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Spatial analysis failed: {str(e)}"
        )

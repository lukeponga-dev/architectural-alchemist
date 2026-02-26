"""AI generation API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from gemini_client import generate_text

router = APIRouter(prefix="/generate", tags=["generation"])


class GenerationRequest(BaseModel):
    prompt: str
    context: Optional[str] = None


class GenerationResponse(BaseModel):
    response: str
    status: str = "success"


@router.post("", response_model=GenerationResponse)
async def generate_design(request: GenerationRequest):
    """Generate architectural design using Gemini."""
    try:
        # Build enhanced prompt with context if provided
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"""Context: {request.context}

User Request: {request.prompt}

Please provide a detailed architectural design response that considers the context above."""
        
        # Generate response using updated Gemini client
        response = generate_text(full_prompt)
        
        return GenerationResponse(
            response=response,
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/health")
async def generation_health():
    """Check generation service health."""
    try:
        # Test with a simple prompt
        test_response = generate_text("Test prompt - respond with 'OK'")
        return {"status": "healthy", "test_response": test_response}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Generation service unhealthy: {str(e)}")

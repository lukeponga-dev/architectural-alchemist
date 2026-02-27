"""AI generation API routes."""

import logging
import time
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from gemini_client import generate_text

# Initialize rate limiter for generation endpoints
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/generate", tags=["generation"])

# Add rate limit exception handler
router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class GenerationRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    stream: Optional[bool] = False


class GenerationResponse(BaseModel):
    response: str
    status: str = "success"


@router.post("", response_model=GenerationResponse)
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def generate_design(request: GenerationRequest, req: Request):
    """Generate architectural design using Gemini."""
    start_time = time.time()
    
    try:
        # Log request details
        logging.info(f"Generation request received - Prompt length: {len(request.prompt)} chars, Stream: {request.stream}")
        
        # Build enhanced prompt with context if provided
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"""Context: {request.context}

User Request: {request.prompt}

Please provide a detailed architectural design response that considers the context above."""
        
        if request.stream:
            # Handle streaming response
            return StreamingResponse(
                stream_generator(full_prompt, start_time),
                media_type="text/plain",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
            )
        else:
            # Generate response using updated Gemini client
            response = generate_text(full_prompt, stream=False)
            
            # Calculate and log response time
            duration = time.time() - start_time
            logging.info(f"Gemini response completed in {duration:.2f}s - Response length: {len(response)} chars")
            
            return GenerationResponse(
                response=response,
                status="success"
            )
        
    except Exception as e:
        duration = time.time() - start_time
        logging.error(f"Generation failed after {duration:.2f}s: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


async def stream_generator(prompt: str, start_time: float):
    """Generator for streaming Gemini responses."""
    try:
        logging.info(f"Starting simulated stream for prompt: {prompt[:50]}...")
        
        chunk_count = 0
        async for chunk in generate_text(prompt, stream=True):
            chunk_count += 1
            logging.info(f"Yielding chunk {chunk_count}: {len(chunk)} chars")
            
            yield f"data: {json.dumps({'chunk': chunk, 'type': 'content'})}\n\n"
        
        # Send completion signal
        duration = time.time() - start_time
        logging.info(f"Simulated streaming completed in {duration:.2f}s with {chunk_count} chunks")
        yield f"data: {json.dumps({'type': 'done', 'duration': f'{duration:.2f}s', 'chunks': chunk_count})}\n\n"
        
    except Exception as e:
        duration = time.time() - start_time
        logging.error(f"Simulated streaming failed after {duration:.2f}s: {str(e)}")
        import traceback
        logging.error(f"Full traceback: {traceback.format_exc()}")
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.get("/health")
async def generation_health():
    """Check generation service health."""
    try:
        # Test with a simple prompt
        start_time = time.time()
        test_response = generate_text("Test prompt - respond with 'OK'")
        duration = time.time() - start_time
        
        logging.info(f"Health check completed in {duration:.2f}s")
        return {"status": "healthy", "test_response": test_response, "response_time": f"{duration:.2f}s"}
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Generation service unhealthy: {str(e)}")

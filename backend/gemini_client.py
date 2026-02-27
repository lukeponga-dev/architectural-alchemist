import os
import logging
import asyncio
from google import genai
from dotenv import load_dotenv
from config import settings

# Load .env for standalone usage
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_LIVE_API_KEY")

if not GEMINI_KEY:
    raise ValueError("GEMINI_LIVE_API_KEY not set")

# Initialize modern genai client
client = genai.Client(api_key=GEMINI_KEY)


async def generate_text_stream_simulated(prompt: str):
    """Simulate streaming by chunking the regular response"""
    try:
        # Get the full response first
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        full_text = response.text
        
        # Split into words and yield them as chunks
        words = full_text.split()
        current_chunk = ""
        
        for i, word in enumerate(words):
            current_chunk += word + " "
            
            # Send chunk every 10 words or at the end
            if (i + 1) % 10 == 0 or i == len(words) - 1:
                if current_chunk.strip():
                    yield current_chunk.strip()
                    await asyncio.sleep(0.1)  # Simulate streaming delay
                current_chunk = ""
                
    except Exception as e:
        # Try fallback models
        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-pro"]
        
        for model in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                full_text = response.text
                
                # Split into words and yield them as chunks
                words = full_text.split()
                current_chunk = ""
                
                for i, word in enumerate(words):
                    current_chunk += word + " "
                    
                    if (i + 1) % 10 == 0 or i == len(words) - 1:
                        if current_chunk.strip():
                            yield current_chunk.strip()
                            await asyncio.sleep(0.1)
                        current_chunk = ""
                return
            except Exception:
                continue
        
        raise Exception(f"All models failed for streaming: {str(e)}")


def generate_text(prompt: str, stream: bool = False):
    """Generate text using Gemini model"""
    if stream:
        # Return the async generator for streaming
        return generate_text_stream_simulated(prompt)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt
        )
        return response.text
    except Exception as e:
        # Try with different model formats
        models_to_try = [
            "gemini-2.0-flash",
            "gemini-1.5-flash-8b", 
            "gemini-1.5-flash",
            "gemini-pro"
        ]
        
        for model in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response.text
            except Exception:
                continue
        
        raise Exception(f"All models failed. Latest error: {str(e)}")

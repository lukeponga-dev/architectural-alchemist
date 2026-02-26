import os
from google import genai
from dotenv import load_dotenv

# Load .env for standalone usage
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_LIVE_API_KEY")

if not GEMINI_KEY:
    raise ValueError("GEMINI_LIVE_API_KEY not set")

# Initialize modern genai client
client = genai.Client(api_key=GEMINI_KEY)


def generate_text(prompt: str):
    """Generate text using Gemini model"""
    response = client.models.generate_content(
        model="gemini-1.5-pro",
        contents=prompt
    )
    return response.text

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env for standalone usage
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_LIVE_API_KEY")

if not GEMINI_KEY:
    raise ValueError("GEMINI_LIVE_API_KEY not set")

# Configure the genai library with the API key
genai.configure(api_key=GEMINI_KEY)


def generate_text(prompt: str):
    """Generate text using Gemini model"""
    model = genai.GenerativeModel('gemini-1.5-pro')
    response = model.generate_content(prompt)
    return response.text

import os
import google.generativeai as genai

GEMINI_KEY = os.getenv("GEMINI_LIVE_API_KEY")

if not GEMINI_KEY:
    raise ValueError("GEMINI_LIVE_API_KEY not set")

genai.configure(api_key=GEMINI_KEY)

model = genai.GenerativeModel("gemini-1.5-pro")

def generate_text(prompt: str):
    response = model.generate_content(prompt)
    return response.text
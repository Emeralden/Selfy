import google.genai as genai

from ..config import settings
from SelfyAPI.dependencies import RedisDep

client = genai.Client(api_key=settings.gemini_api_key)
model_name = "gemini-2.5-flash"

async def generate_flavor(event_id: str, version: str, base: str, tone: str, redis:RedisDep):
    prompt = f"Rewrite this scenario event for a life simulation game. Make the tone {tone}. Keep it crisp and under 2 sentences. Original: {base}"

    response = client.models.generate_content(model=model_name, contents=prompt).text

    cache_key = f"event:{event_id}:{tone}:v{version}"

    await redis.set(cache_key, response)

    return response
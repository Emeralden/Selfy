"""Engine client — thin httpx wrapper around selfy-engine's /resolve endpoint.

Usage:
    result = await engine.resolve("script.aging", char_state_dict)
    result = await engine.resolve("action.resolve", {...})
"""

import httpx
from SelfyAPI.config import settings

ENGINE_URL = settings.engine_url
ENGINE_KEY = settings.engine_api_key

_HEADERS = {
    "X-Engine-Key": ENGINE_KEY,
    "Content-Type": "application/json",
}


async def resolve(type: str, payload: dict) -> dict:
    """Call selfy-engine and return the result dict."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ENGINE_URL}/resolve",
            json={"type": type, "payload": payload},
            headers=_HEADERS,
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()

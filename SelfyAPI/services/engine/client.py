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

# Persistent client — reuses TCP connections across all resolve() calls.
# Eliminates the 6-connection-per-age_up churn that caused local freezes.
_client: httpx.AsyncClient | None = None


async def startup():
    """Call this once on app startup to initialise the connection pool."""
    global _client
    _client = httpx.AsyncClient(headers=_HEADERS, timeout=10.0)


async def shutdown():
    """Call this once on app shutdown to cleanly drain the pool."""
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def resolve(type: str, payload: dict) -> dict:
    """Call selfy-engine and return the result dict."""
    if _client is None:
        raise RuntimeError("Engine client not initialised — call engine.startup() first.")
    resp = await _client.post(
        f"{ENGINE_URL}/resolve",
        json={"type": type, "payload": payload},
    )
    resp.raise_for_status()
    return resp.json()

"""Shared NPC spawn config — loaded from engine's npc_spawn.yaml.

Provides a cached async accessor so the config is fetched once per
process startup and reused across social.py, life.py, and school.py.
"""

import asyncio
from functools import lru_cache

_cache: dict | None = None
_lock = asyncio.Lock()


async def get_spawn_config() -> dict:
    """Return the npc_spawn.yaml config dict (cached after first fetch)."""
    global _cache
    if _cache is not None:
        return _cache
    async with _lock:
        if _cache is None:
            from SelfyAPI.services.engine import client as engine
            _cache = await engine.resolve("npc.spawn_config", {})
    return _cache

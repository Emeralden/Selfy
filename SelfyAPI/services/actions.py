import uuid

from fastapi import HTTPException

from SelfyAPI.dependencies import RedisDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, npc_state, apply_stat_changes, apply_npc_changes


async def cooldowns(char_id: uuid.UUID, action_name: str, limit: int, redis: RedisDep):
    redis_key = f"cooldowns:{char_id}"
    count = int(await redis.hget(redis_key, action_name) or 0)
    if count >= limit:
        raise HTTPException(400, "You already did this too many times this year!")
    else:
        await redis.hincrby(redis_key, action_name, 1)

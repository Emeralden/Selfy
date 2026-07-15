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


async def request_money(char: Character, npc: NPC) -> str:
    if not npc.is_significant:
        return "Who are you? I'm not giving you money!"

    result = await engine.resolve("social.resolve", {
        "action": "request_money",
        "char": char_state(char),
        "npc": npc_state(npc),
    })
    apply_stat_changes(char, result.get("stat_changes", {}))
    apply_npc_changes(npc, result.get("npc_changes", {}))
    return f"Your {npc.role} {result.get('text', '')}"


async def talk_trash(char: Character, npc: NPC) -> str:
    result = await engine.resolve("social.resolve", {
        "action": "talk_trash",
        "char": char_state(char),
        "npc": npc_state(npc),
    })
    apply_stat_changes(char, result.get("stat_changes", {}))
    apply_npc_changes(npc, result.get("npc_changes", {}))
    return f"Your {npc.role} {result.get('text', '')}"


async def hang_out(char: Character, npc: NPC) -> str:
    result = await engine.resolve("social.resolve", {
        "action": "hang_out",
        "char": char_state(char),
        "npc": npc_state(npc),
    })
    apply_stat_changes(char, result.get("stat_changes", {}))
    apply_npc_changes(npc, result.get("npc_changes", {}))
    return f"Your {npc.role} {result.get('text', '')}"

import uuid

from fastapi import APIRouter, HTTPException

from SelfyAPI.models.npc import NPC
from SelfyAPI.services.actions import cooldowns, hang_out, request_money, talk_trash

from ..dependencies import RedisDep, SessionDep
from ..models.character import ActionRequest, Character

router = APIRouter(prefix="/social")


ACTION_MAP = {
    "request_money": (request_money, 1),   # (handler, rate_limit)
    "hang_out":      (hang_out, 3),
    "talk_trash":    (talk_trash, 3),
}


@router.post("/{char_id}/interact")
async def interact(char_id: uuid.UUID, req: ActionRequest, session: SessionDep, redis: RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")

    npc = session.get(NPC, req.npc_id)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found.")

    entry = ACTION_MAP.get(req.action)
    if not entry:
        raise HTTPException(400, "Invalid action!")

    handler, limit = entry
    await cooldowns(char_id, req.action, limit, redis)

    # handlers are now async — engine does the math
    message = await handler(char, npc)

    session.add(char)
    session.add(npc)
    session.commit()

    return message
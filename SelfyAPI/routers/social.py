import uuid

from fastapi import APIRouter, HTTPException

from SelfyAPI.models.npc import NPC
from SelfyAPI.services.actions import cooldowns, hang_out, request_money, talk_trash

from ..dependencies import RedisDep, SessionDep
from ..models.character import ActionRequest, Character

router = APIRouter(prefix="/school")

@router.post("/{char_id}/interact")
async def interact(char_id:uuid.UUID, req:ActionRequest, session:SessionDep, redis:RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")
    
    npc_id = req.npc_id
    
    npc = session.get(NPC, npc_id)
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found.")

    limit = 3
    if req.action == "ask_money":
        limit = 1
    
    action_key = f"{req.action}:{req.npc_id}"

    await cooldowns(char_id, req.action, limit, redis)

    ACTION_MAP = {
        "request_money": request_money,
        "hang_out": hang_out,
        "talk_trash": talk_trash
    }

    try:
        action = ACTION_MAP[req.action]
    except KeyError:
        raise HTTPException(400, "Invalid action!")
    
    message = action(char, npc)
    
    session.commit()

    return message
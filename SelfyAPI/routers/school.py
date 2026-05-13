import uuid

from fastapi import APIRouter, HTTPException

from SelfyAPI.services.actions import cooldowns

from ..dependencies import RedisDep, SessionDep
from ..models.character import Character, Stage

router = APIRouter(prefix="/school")

@router.post("/{char_id}/study")
async def study_harder(char_id:uuid.UUID, session:SessionDep, redis:RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")
    
    acad_stages = {Stage.CHILDHOOD, Stage.HIGH_SCHOOL, Stage.COLLEGE}
    if char.stage not in acad_stages:
        raise HTTPException(status_code=400, detail="Character not in academic stage.")

    redis_key = f"char:{char_id}:school"

    await cooldowns(char_id, "study_hard", 3, redis)

    await redis.hincrby(redis_key, "efforts", 1)

    efforts = int(await redis.hget(redis_key, "efforts"))

    return {"message":"You studied hard!", "character":char.first_name, "efforts":efforts}
    

@router.post("/{char_id}/skip_class")
async def skip_class(char_id:uuid.UUID, session:SessionDep, redis:RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")
    
    acad_stages = {Stage.CHILDHOOD, Stage.HIGH_SCHOOL, Stage.COLLEGE}
    if char.stage not in acad_stages:
        raise HTTPException(status_code=400, detail="Character not in academic stage.")
    
    redis_key = f"char:{char_id}:school"

    await cooldowns(char_id, "skip_class", 3, redis)

    await redis.hincrby(redis_key, "skips", 1)

    return {"message": "You skipped school!", "character": char.first_name}
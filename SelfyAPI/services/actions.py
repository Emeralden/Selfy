import random
import uuid

from fastapi import HTTPException

from SelfyAPI.dependencies import RedisDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.npc import NPC


async def cooldowns(char_id:uuid.UUID, action_name:str, limit:int, redis:RedisDep):
    redis_key=f"cooldowns:{char_id}"
    count =  int(await redis.hget(redis_key, action_name) or 0)

    if count >= limit:
        raise HTTPException(400, "You already did this too many times this year!")
    else:
        await redis.hincrby(redis_key, action_name, 1)

def request_money(char:Character, npc:NPC):
    if not npc.is_significant:
        return "Who are you? I'm not giving you money!"
    chance = char.appeal + random.randint(0,100)
    if chance > npc.strictness:
        char.money += 500
        char.joy  += 5
        return f"Your {npc.role} gave you money!"
    else:
        char.joy -= 5
        npc.resentment += 5
        return f"Your {npc.role} didn't give you any money!"

def talk_trash(char:Character, npc:NPC):
    if npc.temperament >= 70:
        char.body -= 10
        npc.resentment += 10
        return f"Your {npc.role} slapped you!"
    elif npc.temperament<=40:
        char.hubris += 5
        npc.affection -= 20
        return f"Your {npc.role} cried!"
    else:
        char.joy -= 10
        return f"Your {npc.role} insulted you back!"

def hang_out(char:Character, npc:NPC):
    if char.sociability >= 70:
        npc.affection += 15
    else:
        npc.affection += 10
    
    if char.avarice >= 70:
        char.joy -= 5

    return f"You spent some time with your {npc.role}!"

def study_harder(char_id:uuid.UUID):

    return "You studied hard!"
    

def skip_class(char_id:uuid.UUID):

    return "You skipped school!"


import json
import os
import random

from fastapi import BackgroundTasks

from SelfyAPI.dependencies import RedisDep
from SelfyAPI.models.character import Character
from SelfyAPI.services.llm import generate_flavor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NAMES_PATH = os.path.join(BASE_DIR, "data", "events.json")

with open(NAMES_PATH, 'r') as file:
    EVENTS = json.load(file)

OPS = {
    ">=": lambda a, b: a >= b,
    "<=": lambda a, b: a <= b,
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    "in": lambda a, b: a in b
}

def check_conditions(char:Character, conditions:list):
    
    for condition in conditions:
        char_val = getattr(char, condition[0])
        
        if not OPS[condition[1]](char_val, condition[2]):
            return False
        
    return True

def roll_event(char:Character):
    bucket = None
    
    if char.age<=5:
        bucket="age_0_5"
    elif 18<=char.age<=30:
        bucket="age_18_30"
    
    if bucket is None:
        return None

    events = EVENTS.get(bucket, [])

    if not events:
        return None

    valid_events = []

    for event in events:
        conditions = event["conditions"]
        if check_conditions(char, conditions):
            valid_events.append(event)

    if not valid_events:
        return None

    return random.choice(valid_events)        


async def enrich_event(event:dict, tone:str, redis:RedisDep, bg_tasks:BackgroundTasks):

    cache_key = f"event:{event['id']}:{tone}:v{event['version']}"

    cached_text = await redis.get(cache_key)

    if cached_text:
        original_base = event["text_base"]
        event["text_base"] = cached_text
        if random.random() < 0.2:
            bg_tasks.add_task(
                generate_flavor,
                event["id"],
                event["version"],
                original_base,
                tone,
                redis
            )

    else:
        bg_tasks.add_task(
            generate_flavor,
            event["id"],
            event["version"],
            event["text_base"],
            tone,
            redis
        )

    return event
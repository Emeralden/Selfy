import random
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlmodel import col, select

from SelfyAPI.models.npc import NPC
from SelfyAPI.services.aging import calculate_grades, relationship_decay, roll_reaper, stat_decay, transition_stage
from SelfyAPI.services.naming import generate_name, get_states
from SelfyAPI.services.scenarios import enrich_event, roll_event

from ..dependencies import RedisDep, SessionDep, UserDep
from ..models.character import Character, CharacterCreate, Gender, Stage
from ..models.event import LifeEvent

router = APIRouter(prefix="/life")

@router.get("/states")
async def get_states(country: str):
    states = get_states(country)
    if not states:
        raise HTTPException(status_code=404, detail=f"No states found for country: {country}")
    return states

@router.get("/generate-name")
async def generate_name(gender: str, country: str, state: str):
    try:
        first_name, last_name = generate_name(gender, country, state)
        return {"first_name": first_name, "last_name": last_name}
    except KeyError:
        raise HTTPException(status_code=400, detail=f"No name data for {country}/{state}")


@router.post("/birth", response_model=Character)
async def birth_character(char_in: CharacterCreate, session: SessionDep, user:UserDep):

    new_char = Character(**char_in.model_dump())
    new_char.user_id = user.id
    country = new_char.country
    state = new_char.state

    family_name = new_char.last_name

    dad_first_name, _ = generate_name("Male", country, state)
    dad = NPC(
        first_name=dad_first_name,
        last_name=family_name,
        age=random.randint(20, 35),
        gender=Gender.MALE,
        role="Father",
        char_id=new_char.id,
        is_significant=True
    )

    mom_first_name, _ = generate_name("Female", country, state)
    mom = NPC(
        first_name=mom_first_name,
        last_name=family_name,
        age=random.randint(20, 35),
        gender=Gender.FEMALE,
        role="Mother",
        char_id=new_char.id,
        is_significant=True
    )

    session.add(new_char)
    session.commit()
    session.refresh(new_char)

    first_memory = LifeEvent(
        char_id=new_char.id,
        age=0,
        text=f"I was born as a {new_char.gender.value}. My name is {new_char.first_name} {new_char.last_name}.",
    )

    session.add(mom)
    session.add(dad)
    session.add(first_memory)
    session.commit()
    session.refresh(new_char)

    user.active_character_id = new_char.id
    session.add(user)
    session.commit()

    return new_char


@router.patch("/{char_id}/age_up", response_model=Character)
async def age_up(char_id: uuid.UUID, session: SessionDep, redis:RedisDep, bg_tasks:BackgroundTasks):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")

    acad_stages = {Stage.CHILDHOOD, Stage.HIGH_SCHOOL, Stage.COLLEGE}
    redis_key = f"char:{char_id}:school"
    if char.stage in acad_stages:
        efforts = int(await redis.hget(redis_key, "efforts") or 0)
        skips = int(await redis.hget(redis_key, "skips") or 0)
        calculate_grades(char, efforts, skips)

    char.age += 1

    transition_stage(char, session)
    stat_decay(char)
    relationship_decay(char, char.npcs)
    roll_reaper(char)

    age_memory = LifeEvent(
        char_id=char.id, age=char.age, text=(f"I am now {char.age} years old.")
    )

    raw_event = roll_event(char)
    if raw_event:
        rich_event = await enrich_event(raw_event, "same as original", redis, bg_tasks)
        event_log = LifeEvent(
            char_id=char.id, age=char.age, text=rich_event["text_base"]
        )
        session.add(event_log)

    session.add(age_memory)
    session.add(char)
    session.commit()

    session.refresh(char)

    if char.stage in acad_stages:
        await redis.delete(redis_key)
    await redis.delete(f"cooldowns:{char_id}")

    return char



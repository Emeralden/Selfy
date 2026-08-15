import asyncio
import random
import uuid
from typing import List, Dict, Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlmodel import col, select

from SelfyAPI.models.npc import NPC, NPCRole
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.engine.dispatcher import emit_age_up
from SelfyAPI.services.naming import generate_name_async, get_states as svc_get_states

from ..dependencies import RedisDep, SessionDep, UserDep
from ..models.character import Character, CharacterCreate, Gender, Stage
from ..models.event import LifeEvent


class AgeUpResponse(BaseModel):
    character: Character
    scenarios: List[Dict[str, Any]] = []
    new_events: List[Dict[str, Any]] = []


router = APIRouter(prefix="/life")


@router.get("/states")
async def get_states_route(country: str):
    states = await svc_get_states(country)
    if not states:
        raise HTTPException(status_code=404, detail=f"No states found for country: {country}")
    return states


@router.get("/generate-name")
async def generate_name_route(gender: str, country: str, state: str):
    try:
        first_name, last_name = await generate_name_async(gender, country, state)
        return {"first_name": first_name, "last_name": last_name}
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/birth", response_model=Character)
async def birth_character(char_in: CharacterCreate, session: SessionDep, user: UserDep, bg_tasks: BackgroundTasks):

    new_char = Character(**char_in.model_dump())
    new_char.user_id = user.id
    country = new_char.country
    state = new_char.state

    family_name = new_char.last_name

    dad_first_name, _ = await generate_name_async("Male", country, state)
    dad = NPC(
        first_name=dad_first_name,
        last_name=family_name,
        age=random.randint(20, 35),
        gender=Gender.MALE,
        role=NPCRole.FATHER,
        char_id=new_char.id,
        is_significant=True,
    )

    mom_first_name, _ = await generate_name_async("Female", country, state)
    mom = NPC(
        first_name=mom_first_name,
        last_name=family_name,
        age=random.randint(20, 35),
        gender=Gender.FEMALE,
        role=NPCRole.MOTHER,
        char_id=new_char.id,
        is_significant=True,
    )

    session.add(new_char)
    session.commit()
    session.refresh(new_char)

    first_memory = LifeEvent(
        char_id=new_char.id,
        age=0,
        text=f"I was born as a {new_char.gender.value}. My name is {new_char.first_name} {new_char.last_name}.",
    )

    from SelfyAPI.services.engine import client as engine
    from SelfyAPI.services.engine.payload import char_state

    # Step 1: resolve char avatar — engine now returns skin_color alongside avatar_url.
    avatar_result = await engine.resolve("script.avatar", char_state(new_char))
    if avatar_result.get("avatar_url"):
        new_char.avatar_url = avatar_result["avatar_url"]

    # Step 2: generate parent avatars with the SAME skin tone — parallel gather.
    skin_color = avatar_result.get("skin_color")
    dad_avatar, mom_avatar = await asyncio.gather(
        engine.resolve("script.avatar", {
            "first_name": dad.first_name, "id": str(dad.id),
            "age": dad.age, "gender": "Male",
            "state": new_char.state, "skin_color": skin_color,
        }),
        engine.resolve("script.avatar", {
            "first_name": mom.first_name, "id": str(mom.id),
            "age": mom.age, "gender": "Female",
            "state": new_char.state, "skin_color": skin_color,
        }),
    )

    if dad_avatar.get("avatar_url"):
        dad.avatar_url = dad_avatar["avatar_url"]
    if mom_avatar.get("avatar_url"):
        mom.avatar_url = mom_avatar["avatar_url"]

    session.add(mom)
    session.add(dad)
    session.add(first_memory)
    session.commit()
    session.refresh(new_char)
    bg_tasks.add_task(embed_and_save, first_memory.id)

    user.active_character_id = new_char.id
    session.add(user)
    session.commit()

    return new_char


@router.patch("/{char_id}/age_up", response_model=AgeUpResponse)
async def age_up(char_id: uuid.UUID, session: SessionDep, redis: RedisDep, bg_tasks: BackgroundTasks):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character already dead.")

    new_events: List[Dict[str, Any]] = []

    def log_memory(text: str):
        evt = LifeEvent(char_id=char.id, age=char.age, text=text)
        session.add(evt)
        bg_tasks.add_task(embed_and_save, evt.id)
        new_events.append({"id": str(evt.id), "age": evt.age, "text": evt.text})

    scenarios = await emit_age_up(char, session, redis, bg_tasks, log_memory)

    session.commit()

    return AgeUpResponse(character=char, scenarios=scenarios, new_events=new_events)

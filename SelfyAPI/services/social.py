import asyncio
import random

from sqlmodel import select

from SelfyAPI.dependencies import SessionDep
from SelfyAPI.models.character import Character, Gender
from SelfyAPI.models.npc import NPC, NPCRole
from SelfyAPI.services.naming import generate_name_async
from SelfyAPI.services.npc_spawn_config import get_spawn_config




async def spawn_extended(char: Character, session: SessionDep):
    cfg = await get_spawn_config()
    aunt_cfg = cfg.get("nosy_aunt", {"min_age": 25, "max_age": 40})

    archetypes = [
        {"role": NPCRole.RIVAL_COUSIN, "resentment": 30, "temperament": 20, "affection": -10,
         "age": random.randint(char.age - 1, char.age + 1), "gender": char.gender, "is_significant": True},
        {"role": NPCRole.NOSY_AUNT, "affection": -20, "respect": 10,
         "age": random.randint(aunt_cfg["min_age"], aunt_cfg["max_age"]), "gender": "Female", "is_significant": True},
    ]

    # All name calls in parallel — 2 HTTP calls at once instead of sequential.
    names = await asyncio.gather(
        *[generate_name_async(a["gender"], char.country, char.state) for a in archetypes]
    )

    for archetype, (first_name, last_name) in zip(archetypes, names):
        archetype["gender"] = Gender(archetype["gender"])
        session.add(NPC(first_name=first_name, last_name=last_name, char_id=char.id, **archetype))

    session.commit()


async def spawn_school_cohort(char: Character, session: SessionDep, num_kids: int):
    from SelfyAPI.services.engine import client as engine

    cfg = await get_spawn_config()
    teacher_cfg = cfg.get("teacher", {"min_age": 25, "max_age": 50})
    spread = cfg.get("school_cohort", {}).get("kid_age_spread", 1)

    genders = [random.choice(["Male", "Female"]) for _ in range(num_kids + 1)]  # +1 for teacher
    ages_kids   = [random.randint(char.age - spread, char.age + spread) for _ in range(num_kids)]
    age_teacher = random.randint(teacher_cfg["min_age"], teacher_cfg["max_age"])

    # All name calls in parallel
    names = await asyncio.gather(
        *[generate_name_async(g, char.country, char.state) for g in genders]
    )

    # Build NPC objects so we have IDs for avatar seeds
    npcs: list[NPC] = []
    for i in range(num_kids):
        first_name, last_name = names[i]
        npcs.append(NPC(
            first_name=first_name,
            last_name=last_name,
            age=ages_kids[i],
            gender=genders[i],
            role=NPCRole.CLASSMATE,
            char_id=char.id,
        ))

    first_name, last_name = names[-1]
    teacher = NPC(
        first_name=first_name,
        last_name=last_name,
        age=age_teacher,
        gender=genders[-1],
        role=NPCRole.TEACHER,
        char_id=char.id,
    )
    npcs.append(teacher)

    # Generate avatars in one gather — use char's state for skin region
    # skin_color is left as None so each NPC gets their own random pick from
    # the same regional pool (classmates don't need identical skin to the char)
    avatar_payloads = [
        {"first_name": n.first_name, "id": str(n.id),
         "age": n.age, "gender": n.gender.value if hasattr(n.gender, "value") else str(n.gender),
         "state": char.state}
        for n in npcs
    ]
    avatar_results = await asyncio.gather(
        *[engine.resolve("script.avatar", p) for p in avatar_payloads]
    )

    for npc, result in zip(npcs, avatar_results):
        if result.get("avatar_url"):
            npc.avatar_url = result["avatar_url"]
        session.add(npc)

    session.commit()


def purge_npcs(char: Character, session: SessionDep):
    query = select(NPC).where(
        NPC.char_id == char.id,
        NPC.role.in_([NPCRole.CLASSMATE, NPCRole.TEACHER]),
        NPC.is_significant == False,
    )
    for npc in session.exec(query).all():
        session.delete(npc)
    session.commit()


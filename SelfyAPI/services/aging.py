
from SelfyAPI.dependencies import SessionDep
from SelfyAPI.models.character import Character, Stage
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.director import generate_eulogy
from SelfyAPI.services.engine.dispatcher import subscribe_age_up
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, npc_state, apply_stat_changes, apply_npc_changes
from SelfyAPI.services.social import purge_npcs, spawn_extended, spawn_school_cohort


@subscribe_age_up(priority=5)
async def process_school(char, session, redis, bg_tasks, log_memory):
    """Strip school-phase tags once the character ages out of their window."""
    result = await engine.resolve("script.tags", {"age": char.age + 1})
    # Engine may return a bare list or a dict — handle both shapes defensively
    if isinstance(result, list):
        tags_to_remove = result
    else:
        tags_to_remove = result.get("tags_to_remove", [])
    if tags_to_remove and char.tags:
        char.tags = [t for t in char.tags if t not in tags_to_remove]


@subscribe_age_up(priority=10)
async def process_base_aging(char, session, redis, bg_tasks, log_memory):
    char.age += 1
    log_memory(f"I am now {char.age} years old.")

    # Ask engine which stage this age maps to + what lifecycle events to fire
    result = await engine.resolve("script.stage", char_state(char))
    if result.get("stage_changed"):
        char.stage = Stage(result["new_stage"])
        for event in result.get("lifecycle", []):
            await _handle_lifecycle(event, char, session)


async def _handle_lifecycle(event: dict, char: Character, session: SessionDep):
    t = event["type"]
    if t == "spawn_school_cohort":
        await spawn_school_cohort(char, session, event.get("num", 15))
    elif t == "spawn_extended":
        await spawn_extended(char, session)
    elif t == "purge_npcs":
        purge_npcs(char, session)
    elif t == "clear_contextual":
        char.contextual = {}


@subscribe_age_up(priority=20)
async def process_stat_decay(char, session, redis, bg_tasks, log_memory):
    # Stat decay
    changes = await engine.resolve("script.aging", char_state(char))
    apply_stat_changes(char, changes)

    # Relationship decay for all NPCs
    npcs: list[NPC] = char.npcs
    if npcs:
        result = await engine.resolve("script.relations", {
            "sociability": char.sociability,
            "npcs": [npc_state(n) for n in npcs],
        })
        npc_map = {str(n.id): n for n in npcs}
        for updated in result:
            npc = npc_map.get(updated["id"])
            if npc:
                apply_npc_changes(npc, updated)


@subscribe_age_up(priority=30)
async def process_reaper(char, session, redis, bg_tasks, log_memory):
    result = await engine.resolve("script.death", char_state(char))
    if result.get("died"):
        char.alive = False


@subscribe_age_up(priority=999)
async def process_funeral(char, session, redis, bg_tasks, log_memory):
    if not char.alive:
        eulogy = await generate_eulogy(char.id, f"{char.first_name} {char.last_name}", char.age, session)
        log_memory(eulogy)

import asyncio

from SelfyAPI.models.character import Character, Stage
from SelfyAPI.models.npc import NPC
from SelfyAPI.models.user import User
from SelfyAPI.services.director import generate_eulogy
from SelfyAPI.services.engine.dispatcher import subscribe_age_up
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import apply_stat_changes, apply_npc_changes
from SelfyAPI.services.social import purge_npcs, spawn_extended, spawn_school_cohort


# ── Wave 1: age increment only ────────────────────────────────────────────────
# The ONLY reason this is its own wave: wave 2 reads snapshot["age"] for
# script.stage. We need the incremented age in that snapshot.
# process_school (script.tags) uses age+1 from snapshot either way — moved to wave 2.

@subscribe_age_up(priority=5, wave=2)
async def process_school(snapshot, session, redis, bg_tasks, log_memory):
    """Strip school-phase tags once the character ages out of their window.
    Wave 2: aging.yaml is cached after the first engine call, so this fires
    for free alongside avatar/stage/aging/relations in parallel.
    Uses snapshot['age']+1 = next age, same value whether taken pre- or post-increment.
    """
    result = await engine.resolve("script.tags", {"age": snapshot["age"] + 1})
    tags_to_remove = result.get("tags_to_remove", [])

    if not tags_to_remove:
        return None

    def apply(char):
        if char.tags:
            char.tags = [t for t in char.tags if t not in tags_to_remove]

    return apply


@subscribe_age_up(priority=10, wave=1)
async def process_base_aging(snapshot, session, redis, bg_tasks, log_memory):
    """Increment age and log the birthday memory."""
    def apply(char):
        char.age += 1
        log_memory(f"I am now {char.age} years old.")

    return apply


# ── Wave 2: avatar / stage / stat decay ────────────────────────────────────
# All four engine calls (avatar, stage, aging, relations) fire in parallel.
# Barrier after this wave ensures death check (wave 3) sees decayed stats.

@subscribe_age_up(priority=15, wave=2)
async def process_avatar_aging(snapshot, session, redis, bg_tasks, log_memory):
    """Regenerate avatar and check for stage transitions.
    avatar + stage are independent — gather both in one shot.
    """
    avatar_result, stage_result = await asyncio.gather(
        engine.resolve("script.avatar", snapshot),
        engine.resolve("script.stage", snapshot),
    )

    async def apply(char):
        if avatar_result.get("avatar_url"):
            char.avatar_url = avatar_result["avatar_url"]

        if stage_result.get("stage_changed"):
            char.stage = Stage(stage_result["new_stage"])
            for event in stage_result.get("lifecycle", []):
                await _handle_lifecycle(event, char, session)

    return apply


async def _handle_lifecycle(event: dict, char: Character, session):
    t = event["type"]
    if t == "spawn_school_cohort":
        await spawn_school_cohort(char, session, event.get("num", 15))
    elif t == "spawn_extended":
        await spawn_extended(char, session)
    elif t == "purge_npcs":
        purge_npcs(char, session)


@subscribe_age_up(priority=20, wave=2)
async def process_stat_decay(snapshot, session, redis, bg_tasks, log_memory):
    """Decay character stats and NPC relationships.
    aging + relations are independent — gather both in one shot.
    """
    npc_snaps = snapshot.get("_npcs", [])

    if npc_snaps:
        aging_changes, relations_result = await asyncio.gather(
            engine.resolve("script.aging", snapshot),
            engine.resolve("script.relations", {
                "sociability": snapshot["sociability"],
                "npcs": npc_snaps,
            }),
        )
    else:
        aging_changes = await engine.resolve("script.aging", snapshot)
        relations_result = []

    def apply(char):
        apply_stat_changes(char, aging_changes)
        if relations_result:
            npc_map = {str(n.id): n for n in (char.npcs or [])}
            for updated in relations_result:
                npc = npc_map.get(updated["id"])
                if npc:
                    apply_npc_changes(npc, updated)

    return apply


# ── Wave 3: death check ──────────────────────────────────────────────────────
# Needs decayed stats from wave 2. Barrier after this wave feeds char.alive
# to the event handlers and funeral in later waves.

@subscribe_age_up(priority=30, wave=3)
async def process_reaper(snapshot, session, redis, bg_tasks, log_memory):
    """Roll for death using post-decay stats."""
    result = await engine.resolve("script.death", snapshot)

    if not result.get("died"):
        return None

    def apply(char):
        char.alive = False
        user = session.get(User, char.user_id)
        if user and user.active_character_id == char.id:
            user.active_character_id = None

    return apply


# ── Wave 5: cleanup + funeral ────────────────────────────────────────────────
# Always runs. Funeral checks snapshot["alive"] set by wave 3's apply.

@subscribe_age_up(priority=999, wave=5)
async def process_funeral(snapshot, session, redis, bg_tasks, log_memory):
    """Generate a eulogy if the character died this year."""
    if snapshot.get("alive", True):
        return None

    eulogy = await generate_eulogy(
        snapshot["id"],
        f"{snapshot['first_name']} {snapshot.get('last_name', '')}",
        snapshot["age"],
        session,
    )

    def apply(char):
        log_memory(eulogy)

    return apply

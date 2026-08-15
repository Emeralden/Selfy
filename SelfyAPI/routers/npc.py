"""NPC interaction router — NPC is the primary entry point.

GET /npc/{char_id}/{npc_id}/actions   → role-appropriate action list
GET /npc/{char_id}/{npc_id}/interact  → resolve action, apply changes, log event
"""

import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, npc_state
from SelfyAPI.services.engine.pipeline import resolve_and_persist
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.routers.utils import get_char_or_404

router = APIRouter(prefix="/npc")


def _get_char_and_npc(
    char_id: uuid.UUID,
    npc_id: uuid.UUID,
    session,
) -> tuple[Character, NPC]:
    """Fetch and validate char + NPC ownership in one shot."""
    char = get_char_or_404(session, char_id)
    if not char.alive:
        raise HTTPException(status_code=400, detail="Character is dead.")

    npc = session.get(NPC, npc_id)
    if not npc or npc.char_id != char_id:
        raise HTTPException(status_code=404, detail="NPC not found.")

    return char, npc


@router.get("/{char_id}/{npc_id}/actions")
async def get_actions(
    char_id: uuid.UUID,
    npc_id: uuid.UUID,
    session: SessionDep,
):
    """Return the action list appropriate for this NPC's role."""
    char, npc = _get_char_and_npc(char_id, npc_id, session)
    return await engine.resolve("npc.available", {
        "npc_role": npc.role.value,
        "age":      char.age,
        "tags":     list(char.tags or []),
    })


@router.get("/{char_id}/{npc_id}/interact")
async def interact(
    char_id: uuid.UUID,
    npc_id: uuid.UUID,
    action_name: str,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
    force_result: str | None = None,
):
    """Resolve a player-initiated NPC interaction."""
    char, npc = _get_char_and_npc(char_id, npc_id, session)

    # 1. Validate action exists for this NPC's role
    available = await engine.resolve("npc.available", {
        "npc_role": npc.role.value,
        "age":      char.age,
        "tags":     list(char.tags or []),
    })
    action_meta = next((a for a in available if a["id"] == action_name), None)
    if not action_meta:
        raise HTTPException(
            status_code=403,
            detail=f"Action '{action_name}' not available for NPC role '{npc.role.value}'.",
        )

    # 2. Rate-limit — keyed per (npc_id, action_name) so limits are per-relationship
    stats_apply = await within_limit(
        redis, char_id, char.age, f"npc:{npc_id}:{action_name}", action_meta["yearly_limit"]
    )

    return await resolve_and_persist(
        engine_type="npc.resolve",
        engine_payload={
            "action_id":    action_name,
            "npc_role":     npc.role.value,
            "char":         char_state(char),
            "npc":          npc_state(npc),
            "force_result": force_result,
        },
        char=char,
        session=session,
        redis=redis,
        bg_tasks=bg_tasks,
        apply_stats=stats_apply,
        npc=npc if stats_apply else None,
        result_fields=["success", "roll", "npc_changes"],
    )

"""Participate router — club management + extracurricular activities.

Club definitions live in the engine (clubs.yaml).
This router is a thin orchestration layer: fetch from engine, persist to DB.
"""

import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state
from SelfyAPI.services.engine.pipeline import resolve_and_persist
from SelfyAPI.routers.actions import make_action_router
from SelfyAPI.routers.utils import get_char_or_404, remove_tag

router = make_action_router("participate", "participate")

_CLUB_TAG_PREFIX = "Club_"


def _get_club_tag(char: Character) -> str | None:
    """Return the active Club_* tag, or None."""
    return next((t for t in (char.tags or []) if t.startswith(_CLUB_TAG_PREFIX)), None)


# ── Club endpoints ────────────────────────────────────────────────────────────

@router.get("/{char_id}/clubs")
async def list_clubs(char_id: uuid.UUID, session: SessionDep):
    """Return available clubs from the engine (filtered by age/tags)."""
    char = get_char_or_404(session, char_id)
    return await engine.resolve("clubs.available", {
        "age":  char.age,
        "tags": list(char.tags or []),
    })


@router.get("/{char_id}/club")
async def get_club(char_id: uuid.UUID, session: SessionDep):
    """Return the character's current club, or null."""
    char = get_char_or_404(session, char_id)

    tag = _get_club_tag(char)
    if not tag:
        return {"club": None}

    club_id = tag.removeprefix(_CLUB_TAG_PREFIX).lower()
    result = await engine.resolve("clubs.get", {"club_id": club_id})

    if "error" in result:
        return {"club": club_id, "emoji": "🏅", "key": club_id}

    return {"club": result["label"], "emoji": result["emoji"], "key": result["id"]}


@router.post("/{char_id}/club/join")
async def join_club(
    char_id: uuid.UUID,
    club: str,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
):
    """Join a club by key (e.g. 'drama', 'cricket'). Delegates to engine for stats."""
    char = get_char_or_404(session, char_id)

    if _get_club_tag(char):
        raise HTTPException(status_code=400, detail="Already in a club. Leave first.")

    return await resolve_and_persist(
        engine_type="clubs.resolve",
        engine_payload={"club_id": club, "state": char_state(char)},
        char=char,
        session=session,
        redis=redis,
        bg_tasks=bg_tasks,
    )


@router.delete("/{char_id}/club/leave")
async def leave_club(char_id: uuid.UUID, session: SessionDep):
    """Leave the current club — removes the Club_* tag."""
    char = get_char_or_404(session, char_id)
    tag = _get_club_tag(char)
    if not tag:
        raise HTTPException(status_code=400, detail="Not currently in a club.")
    remove_tag(char, session, tag)
    return {"ok": True}

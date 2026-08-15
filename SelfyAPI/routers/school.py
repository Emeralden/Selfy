import uuid
import random

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.npc import NPC, NPCRole
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, apply_stat_changes
from SelfyAPI.services.engine.pipeline import resolve_and_persist
from SelfyAPI.services.social import spawn_school_cohort, purge_npcs
from SelfyAPI.routers.actions import make_action_router
from SelfyAPI.routers.utils import get_char_or_404, remove_tag
from SelfyAPI.constants import (
    SCHOOL_DROPOUT_TAG, TUITION_TAG, MONITOR_TAG,
    SCHOOL_ENROLLED_TAGS, SCHOOL_DROPOUT_MIN_AGE,
)

router = make_action_router("school", "school")


def _is_enrolled(char: Character) -> bool:
    return SCHOOL_DROPOUT_TAG not in (char.tags or [])


# ── Tuition ───────────────────────────────────────────────────────────────────

@router.delete("/{char_id}/tuition")
async def leave_tuition(char_id: uuid.UUID, session: SessionDep):
    """Remove the Tuition tag — player dropped out of tuition."""
    char = get_char_or_404(session, char_id)
    remove_tag(char, session, TUITION_TAG, missing_detail="Not currently enrolled in tuition.")
    return {"ok": True}


# ── Change School ─────────────────────────────────────────────────────────────

@router.post("/{char_id}/change")
async def change_school(
    char_id: uuid.UUID,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
):
    """Roll for parent approval to change schools.
    Success → regenerate classmates + teacher, partial grade reset.
    Fail    → parents said no, nothing changes.
    """
    char = get_char_or_404(session, char_id)
    if not _is_enrolled(char):
        raise HTTPException(status_code=400, detail="Not currently enrolled in school.")

    result = await engine.resolve("action.resolve", {
        "phase":     "school",
        "action_id": "change_school",
        "state":     char_state(char),
    })
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    if result.get("success"):
        purge_npcs(char, session)
        await spawn_school_cohort(char, session, num_kids=random.randint(3, 6))
        char.grades = max(0, char.grades - random.randint(5, 15))
        apply_stat_changes(char, result.get("stat_changes", {}))
        session.add(char)
        session.commit()

    from SelfyAPI.models.event import LifeEvent
    from SelfyAPI.services.scenarios import enrich_event

    event = {
        "id":        "change_school",
        "version":   "1.0",
        "text_base": result.get("text", ""),
        "title":     result.get("title", ""),
    }
    await enrich_event(event, result.get("tone", "neutral"), redis, bg_tasks)

    if result.get("success"):
        log_entry = LifeEvent(char_id=char_id, age=char.age, text=result.get("text", ""))
        session.add(log_entry)
        session.commit()
        session.refresh(log_entry)
        bg_tasks.add_task(embed_and_save, log_entry.id)

    return {
        "success": result.get("success"),
        "title":   event["title"],
        "body":    event["text_base"],
        "roll":    result.get("roll"),
    }


# ── Drop School ───────────────────────────────────────────────────────────────

@router.post("/{char_id}/drop")
async def drop_school(char_id: uuid.UUID, session: SessionDep):
    """Drop out of school.
    Ages 6–12: blocked — parents won't allow.
    Ages 13+:  dropout tag applied, school NPCs purged.
    """
    char = get_char_or_404(session, char_id)
    if not _is_enrolled(char):
        raise HTTPException(status_code=400, detail="Already dropped out.")

    if char.age < SCHOOL_DROPOUT_MIN_AGE:
        return {
            "allowed": False,
            "title":   "Parents Said No 🚫",
            "body":    "You brought it up once. They shut it down before you finished the sentence. 'You are going to school whether you like it or not.' End of discussion.",
        }

    char.tags = list(char.tags or []) + [SCHOOL_DROPOUT_TAG]
    char.tags = [t for t in char.tags if t not in SCHOOL_ENROLLED_TAGS]

    purge_npcs(char, session)
    session.add(char)
    session.commit()

    return {
        "allowed": True,
        "title":   "Dropped Out 🎒",
        "body":    "You handed in your ID card, walked out the gate, and didn't look back. The future is completely unwritten. That's terrifying. That's also kind of the point.",
    }


@router.post("/{char_id}/rejoin")
async def rejoin_school(
    char_id: uuid.UUID,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
):
    """Rejoin school after dropping out — spawns a new cohort."""
    char = get_char_or_404(session, char_id)
    if _is_enrolled(char):
        raise HTTPException(status_code=400, detail="Already enrolled in school.")

    remove_tag(char, session, SCHOOL_DROPOUT_TAG)
    await spawn_school_cohort(char, session, num_kids=random.randint(3, 6))
    session.add(char)
    session.commit()

    return {
        "title": "Back in School 📚",
        "body":  "You walked back in. New faces, new teachers, same desks. It felt strange being the one who left and came back. But you're here now.",
    }

import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.event import LifeEvent
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, apply_stat_changes
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.services.scenarios import enrich_event

router = APIRouter(prefix="/school")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{char_id}/actions")
async def get_actions(char_id: uuid.UUID, session: SessionDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")

    return await engine.resolve("action.available", {
        "phase": "school",
        "age":   char.age,
        "tags":  list(char.tags or []),
    })


@router.delete("/{char_id}/tuition")
async def leave_tuition(char_id: uuid.UUID, session: SessionDep):
    """Remove the Tuition tag — player dropped out of tuition."""
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if "Tuition" not in (char.tags or []):
        raise HTTPException(status_code=400, detail="Not currently enrolled in tuition.")
    char.tags = [t for t in char.tags if t != "Tuition"]
    session.add(char)
    session.commit()
    return {"ok": True}


@router.get("/{char_id}/action")
async def do_action(
    char_id: uuid.UUID,
    action_name: str,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")

    # 1. Ask engine what's available — validates action + age + tags in one shot
    available = await engine.resolve("action.available", {
        "phase": "school",
        "age":   char.age,
        "tags":  list(char.tags or []),
    })
    action_meta = next((a for a in available if a["id"] == action_name), None)
    if not action_meta:
        raise HTTPException(status_code=403, detail="Action not available.")

    # 2. Rate-limit check (API concern — stays here)
    stats_apply = await within_limit(redis, char_id, char.age, action_name, action_meta["yearly_limit"])

    # 3. Resolve action in engine — get effects
    result = await engine.resolve("action.resolve", {
        "phase":     "school",
        "action_id": action_name,
        "state":     char_state(char),
    })

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # 4. Apply effects + tags (only if within rate limit)
    if stats_apply:
        apply_stat_changes(char, result.get("stat_changes", {}))
        for tag in result.get("tags_granted", []):
            if tag not in (char.tags or []):
                char.tags = list(char.tags or []) + [tag]

    # 5. LLM enrichment (API concern — stays here)
    event = {
        "id":        action_name,
        "version":   "1.0",
        "text_base": result.get("text", ""),
        "title":     result.get("title", ""),
    }
    await enrich_event(event, result.get("tone", "neutral"), redis, bg_tasks)

    # 6. Log + persist (API concern — stays here)
    base_text = result.get("text", "")
    log_entry = LifeEvent(char_id=char_id, age=char.age, text=base_text)
    session.add(log_entry)
    session.add(char)
    session.commit()
    session.refresh(log_entry)
    bg_tasks.add_task(embed_and_save, log_entry.id)

    return {
        "title": event["title"],
        "body":  event["text_base"],
    }

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

router = APIRouter(prefix="/pre-school")

MAX_STARS = 5


def _star_key(char_id: uuid.UUID, age: int) -> str:
    return f"edu_stars:{char_id}:{age}"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{char_id}/stars")
async def get_stars(char_id: uuid.UUID, session: SessionDep, redis: RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    raw = await redis.get(_star_key(char_id, char.age))
    return {"stars": min(int(raw or 0), MAX_STARS)}


@router.get("/{char_id}/actions")
async def get_actions(char_id: uuid.UUID, session: SessionDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    return await engine.resolve("action.available", {
        "phase": "preschool",
        "age":   char.age,
        "tags":  list(char.tags or []),
    })


@router.get("/{char_id}/action")
async def do_action(
    char_id: uuid.UUID,
    action_name: str,
    session: SessionDep,
    redis: RedisDep,
    bg_tasks: BackgroundTasks,
    outcome: str | None = None,
):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")

    # 1. Validate action is available for this age/tags
    available = await engine.resolve("action.available", {
        "phase": "preschool",
        "age":   char.age,
        "tags":  list(char.tags or []),
    })
    action_meta = next((a for a in available if a["id"] == action_name), None)
    if not action_meta:
        raise HTTPException(status_code=403, detail="Action not available.")

    # 2. Rate-limit (API concern)
    stats_apply = await within_limit(redis, char_id, char.age, action_name, action_meta["yearly_limit"])

    # 3. Resolve in engine
    result = await engine.resolve("action.resolve", {
        "phase":          "preschool",
        "action_id":      action_name,
        "outcome_choice": outcome,
        "state":          char_state(char),
    })

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # 4. Apply + star tracking (API concern — Redis star counter stays here)
    key = _star_key(char_id, char.age)
    stars = min(int(await redis.get(key) or 0), MAX_STARS)
    if stats_apply:
        apply_stat_changes(char, result.get("stat_changes", {}))
        if result.get("gives_star") and stars < MAX_STARS:
            stars = min(int(await redis.incr(key)), MAX_STARS)

    # 5. LLM enrichment
    event = {
        "id":        action_name,
        "version":   "1.0",
        "text_base": result.get("text", ""),
        "title":     result.get("title", ""),
    }
    await enrich_event(event, result.get("tone", "neutral"), redis, bg_tasks)

    # 6. Log + persist
    log_entry = LifeEvent(char_id=char_id, age=char.age, text=result.get("text", ""))
    session.add(log_entry)
    session.add(char)
    session.commit()
    session.refresh(log_entry)
    bg_tasks.add_task(embed_and_save, log_entry.id)

    return {
        "title": event["title"],
        "body":  event["text_base"],
        "stars": stars,
    }
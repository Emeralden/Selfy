"""resolve_and_persist — the one pipeline for engine ↔ API interactions.

Every action endpoint follows the same 6 steps:
  1. Call engine
  2. Check for errors
  3. Apply stat/tag/NPC changes to models
  4. LLM-enrich event text
  5. Log LifeEvent + persist to DB
  6. Return {title, body, ...extras}

This helper encapsulates all of them. Routers just fetch the char,
build the payload, and call resolve_and_persist().
"""

from typing import Any

from fastapi import BackgroundTasks, HTTPException

from SelfyAPI.models.character import Character
from SelfyAPI.models.event import LifeEvent
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import (
    apply_npc_changes,
    apply_stat_changes,
)
from SelfyAPI.services.scenarios import enrich_event


async def resolve_and_persist(
    *,
    engine_type: str,
    engine_payload: dict,
    char: Character,
    session,
    redis,
    bg_tasks: BackgroundTasks,
    # ── Optional ──────────────────────────────────────────────────────────────
    apply_stats: bool = True,
    apply_tags: bool = True,
    npc: NPC | None = None,           # pass to also apply npc_changes + persist npc
    extra_models: list | None = None,  # any additional SQLModel objects to session.add()
    extra_response: dict | None = None, # merged into the return dict (static values)
    result_fields: list[str] | None = None, # engine result keys to forward to caller
) -> dict:
    """Call the engine, apply results, enrich text, log + persist.

    Args:
        result_fields: engine result keys to include in the response
                       e.g. ["success", "roll", "npc_changes"]

    Returns: {"title": ..., "body": ..., **extra_response, **result_fields}
    Raises:  HTTPException(400) if engine returns an error.
    """
    result = await engine.resolve(engine_type, engine_payload)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # ── Apply stat / tag / NPC changes ────────────────────────────────────────
    if apply_stats:
        apply_stat_changes(char, result.get("stat_changes", {}))

    if apply_tags:
        for tag in result.get("tags_granted", []):
            if tag not in (char.tags or []):
                char.tags = list(char.tags or []) + [tag]

    if npc is not None:
        apply_npc_changes(npc, result.get("npc_changes", {}))

    # ── LLM enrichment ────────────────────────────────────────────────────────
    event: dict[str, Any] = {
        "id":        engine_payload.get("action_id") or engine_type,
        "version":   "1.0",
        "text_base": result.get("text", ""),
        "title":     result.get("title", ""),
    }
    await enrich_event(event, result.get("tone", "neutral"), redis, bg_tasks)

    # ── Log LifeEvent + persist ────────────────────────────────────────────────
    log_entry = LifeEvent(
        char_id=char.id,
        age=char.age,
        text=result.get("text", ""),
    )
    session.add(log_entry)
    session.add(char)
    if npc is not None:
        session.add(npc)
    for m in (extra_models or []):
        session.add(m)
    session.commit()
    session.refresh(log_entry)
    bg_tasks.add_task(embed_and_save, log_entry.id)

    # ── Return ────────────────────────────────────────────────────────────────
    response: dict[str, Any] = {
        "title": event["title"],
        "body":  event["text_base"],
    }
    if extra_response:
        response.update(extra_response)
    for key in (result_fields or []):
        response[key] = result.get(key)
    return response

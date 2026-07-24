
import random

from fastapi import BackgroundTasks

from SelfyAPI.dependencies import RedisDep
from SelfyAPI.models.character import Character
from SelfyAPI.services.engine.dispatcher import subscribe_age_up
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state, apply_stat_changes
from SelfyAPI.services.llm import generate_flavor


async def enrich_event(event: dict, tone: str, redis: RedisDep, bg_tasks: BackgroundTasks):
    """LLM-enrich event text. Unchanged — this is API concern, not math."""
    cache_key = f"event:{event['id']}:{tone}:v{event.get('version', '1.0')}"
    cached_text = await redis.get(cache_key)

    if cached_text:
        original_base = event["text_base"]
        event["text_base"] = cached_text
        if random.random() < 0.2:
            bg_tasks.add_task(generate_flavor, event["id"], event.get("version", "1.0"),
                              original_base, tone, redis)
    else:
        bg_tasks.add_task(generate_flavor, event["id"], event.get("version", "1.0"),
                          event["text_base"], tone, redis)

    return event


@subscribe_age_up(priority=50)
async def process_random_events(char, session, redis, bg_tasks, log_memory):
    """Roll for an ambient event. Engine decides what fires, API logs + enriches."""
    result = await engine.resolve("ambient.roll", char_state(char))
    raw_event = result.get("event")

    if not raw_event:
        return None

    # Normalize into the shape enrich_event expects
    event = {
        "id":        raw_event["id"],
        "version":   "1.0",
        "text_base": raw_event.get("text", ""),
        "title":     raw_event.get("id", ""),
        "choices":   raw_event.get("choices", []),
        "tone":      raw_event.get("tone", "neutral"),
        "icon":      raw_event.get("icon", "auto_awesome")
    }

    await enrich_event(event, event["tone"], redis, bg_tasks)
    log_memory(event["text_base"])
    return event


@subscribe_age_up(priority=45)
async def process_scripted_events(char, session, redis, bg_tasks, log_memory):
    """Check for and trigger age-specific scripted events."""
    result = await engine.resolve("script.events", char_state(char))
    raw_event = result.get("event")

    if not raw_event:
        return None

    event = {
        "id":        raw_event["id"],
        "version":   "1.0",
        "text_base": raw_event.get("text", ""),
        "title":     raw_event.get("title", ""),
        "choices":   raw_event.get("choices", []),
        "tone":      raw_event.get("tone", "neutral"),
        "icon":      raw_event.get("icon", "event")
    }

    await enrich_event(event, event["tone"], redis, bg_tasks)
    log_memory(event["text_base"])
    return event

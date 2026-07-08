import random
import uuid
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.event import LifeEvent
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.services.scenarios import enrich_event

router = APIRouter(prefix="/school")

SCHOOL_ACTIONS: dict[str, dict] = {
    "raise_hand": {
        "action_type":  "passive",
        "id":           "school_raise_hand",
        "label":        "Raise Hand",
        "description":  "Answer the teacher's question",
        "emoji":        "✋",
        "theme":        "amber",
        "age_range":    [6, 9],
        "yearly_limit": 3,
        "title":        "Ooh Pick Me! ✋",
        "text_base":    "Your hand shot up before the question even finished. The teacher called on you. You got it right. The class groaned.",
        "tone":         "earnest",
        "stat_effects": {"mind": 2, "appeal": 1, "grades": 1},
    },
    "finish_homework": {
        "action_type":  "passive",
        "id":           "school_finish_homework",
        "label":        "Finish Homework",
        "description":  "Complete all assignments on time",
        "emoji":        "📝",
        "theme":        "indigo",
        "age_range":    [6, 9],
        "yearly_limit": 2,
        "title":        "Done and Dusted! 📝",
        "text_base":    "You sat at the table and actually did all of it. Every problem. Every page. You felt suspiciously proud of yourself.",
        "tone":         "proud",
        "stat_effects": {"mind": 2, "discipline": 2, "grades": 3},
    },
    "draw_on_desk": {
        "action_type":  "passive",
        "id":           "school_draw_on_desk",
        "label":        "Draw on Desk",
        "description":  "Leave your mark on the furniture",
        "emoji":        "✏️",
        "theme":        "pink",
        "age_range":    [6, 9],
        "yearly_limit": 2,
        "title":        "Vandal Artist ✏️",
        "text_base":    "You carved your initials into the wooden desk with a pen. Beautifully done. The janitor will hate you. Art endures.",
        "tone":         "mischievous",
        "stat_effects": {"joy": 3, "karma": -2},
    },
    "play_outside": {
        "action_type":  "passive",
        "id":           "school_play_outside",
        "label":        "Play Outside",
        "description":  "Run around during recess",
        "emoji":        "🏃",
        "theme":        "green",
        "age_range":    [6, 13],
        "yearly_limit": 3,
        "title":        "Recess Champion 🏃",
        "text_base":    "You sprinted across the playground like your life depended on it. It didn't. But it felt that way. Glorious.",
        "tone":         "joyful",
        "stat_effects": {"body": 3, "joy": 2},
    },
    "study_for_test": {
        "action_type":  "passive",
        "id":           "school_study_for_test",
        "label":        "Study for Test",
        "description":  "Hit the books before the big exam",
        "emoji":        "📖",
        "theme":        "indigo",
        "age_range":    [10, 13],
        "yearly_limit": 2,
        "title":        "Grind Mode On 📖",
        "text_base":    "You opened the textbook at 9 PM. Then it was midnight. You didn't notice. The test tomorrow suddenly feels very possible.",
        "tone":         "diligent",
        "stat_effects": {"mind": 2, "discipline": 2, "grades": 3},
    },
    "run_for_monitor": {
        "action_type":         "roll",
        "id":                  "school_run_for_monitor",
        "label":               "Run for Monitor",
        "description":         "Campaign for class monitor",
        "emoji":               "📋",
        "theme":               "indigo",
        "age_range":           [10, 13],
        "yearly_limit":        1,           # one attempt per year
        "requires_tag_absent": "Monitor",   # hidden once earned
        "tone":                "ambitious",
        # roll: appeal + sociability + discipline + randint(-30, 30) vs threshold
        "success_score":       150,
        "grants_tag":          "Monitor",
        "success": {
            "title":        "Class Monitor! 📋",
            "text_base":    "You gave a speech. You made promises. Some were lies. But the class voted for you. Power tastes like chalk dust and responsibility.",
            "stat_effects": {"appeal": 3, "sociability": 3, "discipline": 2},
        },
        "fail": {
            "title":        "Lost the Election 😔",
            "text_base":    "You gave a speech. The class voted for someone else. You applauded politely. It hurt. There's always next year.",
            "stat_effects": {"appeal": 1},
        },
    },
    "join_tuition": {
        "action_type":         "passive",
        "id":                  "school_join_tuition",
        "label":               "Join Tuition",
        "description":         "Extra classes for better grades",
        "emoji":               "🎒",
        "theme":               "green",
        "age_range":           [10, 16],
        "yearly_limit":        1,
        "requires_tag_absent": "Tuition",  # hidden once already enrolled
        "grants_tag":          "Tuition",
        "title":               "Enrolled! 🎒",
        "text_base":           "Extra class. Extra notes. Extra boredom. But something clicked that the regular teacher never once explained properly.",
        "tone":                "studious",
        "stat_effects":        {"mind": 4, "grades": 3},
    },
    "goof_around": {
        "action_type":  "passive",
        "id":           "school_goof_around",
        "label":        "Goof Around",
        "description":  "Cause some harmless chaos",
        "emoji":        "😜",
        "theme":        "orange",
        "age_range":    [10, 13],
        "yearly_limit": 3,
        "title":        "Menace to Society 😜",
        "text_base":    "You flicked an eraser. It hit the board. The teacher turned around. You stared at the ceiling. Nobody saw nothing.",
        "tone":         "chaotic",
        "stat_effects": {"joy": 3, "savvy": 2, "discipline": -2},
    },
    "solve_papers": {
        "action_type":  "passive",
        "id":           "school_solve_papers",
        "label":        "Solve Practice Papers",
        "description":  "Grind through past exam papers",
        "emoji":        "📝",
        "theme":        "orange",
        "age_range":    [14, 16],
        "yearly_limit": 2,
        "title":        "Paper Machine 📝",
        "text_base":    "Page after page of past exam questions. Your hand cramped. Your brain buzzed. You are slowly becoming the exam itself.",
        "tone":         "diligent",
        "stat_effects": {"mind": 3, "discipline": 2, "grades": 4},
    },
    "visit_library": {
        "action_type":  "passive",
        "id":           "school_visit_library",
        "label":        "Visit the Library",
        "description":  "Spend a quiet hour with the books",
        "emoji":        "🏛️",
        "theme":        "sky",
        "age_range":    [14, 16],
        "yearly_limit": 1,
        "title":        "Quiet Hours 🏛️",
        "text_base":    "You sat in the library for an hour. Nobody talked. Nobody breathed too loud. You read three chapters and felt weirdly at peace.",
        "tone":         "reflective",
        "stat_effects": {"mind": 3, "grades": 2},
    },
    "scroll_phone": {
        "action_type":  "passive",
        "id":           "school_scroll_phone",
        "label":        "Scroll Phone in Class",
        "description":  "Doom-scroll during the lecture",
        "emoji":        "📱",
        "theme":        "red",
        "age_range":    [14, 16],
        "yearly_limit": 3,
        "title":        "Doom Scrolled 📱",
        "text_base":    "Forty-five minutes of reels, memes, and videos of strangers' cats. You retained nothing from the lecture. Perfect.",
        "tone":         "rebellious",
        "stat_effects": {"joy": 3, "karma": -5, "mind": -1},
    },
}


# ── Action handlers ───────────────────────────────────────────────────────────

def _apply_stats(char: Character, stat_effects: dict) -> None:
    for stat, delta in stat_effects.items():
        current = getattr(char, stat, None)
        if current is not None:
            setattr(char, stat, current + delta)


async def _handle_passive(
    char: Character, cfg: dict, stats_apply: bool,
    redis: RedisDep, bg_tasks: BackgroundTasks,
) -> tuple[dict, str]:
    # Always grant the tag on a valid call — tags are not rate-limited, only stats are.
    if cfg.get("grants_tag"):
        tag = cfg["grants_tag"]
        if tag not in (char.tags or []):
            char.tags = list(char.tags or []) + [tag]
    if stats_apply:
        _apply_stats(char, cfg["stat_effects"])

    event = {"id": cfg["id"], "version": "1.0",
             "text_base": cfg["text_base"], "title": cfg["title"]}
    base_text = cfg["text_base"]
    await enrich_event(event, cfg["tone"], redis, bg_tasks)
    return event, base_text


async def _handle_roll(
    char: Character, cfg: dict, stats_apply: bool,
    redis: RedisDep, bg_tasks: BackgroundTasks,
) -> tuple[dict, str]:
    score = (char.appeal + char.sociability + char.discipline
             + random.randint(-30, 30))
    won = score >= cfg.get("success_score", 150)
    outcome = cfg["success"] if won else cfg["fail"]

    if stats_apply:
        _apply_stats(char, outcome["stat_effects"])
        if won and cfg.get("grants_tag"):
            char.tags = list(char.tags or []) + [cfg["grants_tag"]]

    event = {"id": cfg["id"], "version": "1.0",
             "text_base": outcome["text_base"], "title": outcome["title"]}
    base_text = outcome["text_base"]
    await enrich_event(event, cfg["tone"], redis, bg_tasks)
    return event, base_text


ACTION_HANDLERS = {
    "passive": _handle_passive,
    "roll":    _handle_roll,
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _actions_for_age(age: int, char: Character) -> list[dict]:
    """Actions valid for this age, filtered by character state (tags etc.)."""
    result = []
    for action_id, cfg in SCHOOL_ACTIONS.items():
        lo, hi = cfg["age_range"]
        if not (lo <= age <= hi):
            continue
        absent_tag = cfg.get("requires_tag_absent")
        if absent_tag and absent_tag in (char.tags or []):
            continue
        result.append({
            "id":          action_id,
            "label":       cfg["label"],
            "description": cfg["description"],
            "emoji":       cfg["emoji"],
            "theme":       cfg["theme"],
            "action_type": cfg["action_type"],
        })
    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{char_id}/actions")
async def get_actions(char_id: uuid.UUID, session: SessionDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    return _actions_for_age(char.age, char)


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

    cfg = SCHOOL_ACTIONS.get(action_name)
    if not cfg:
        raise HTTPException(status_code=400, detail="Invalid school action.")

    lo, hi = cfg["age_range"]
    if not (lo <= char.age <= hi):
        raise HTTPException(status_code=403, detail="Action not available at this age.")

    absent_tag = cfg.get("requires_tag_absent")
    if absent_tag and absent_tag in (char.tags or []):
        raise HTTPException(status_code=403, detail="You've already achieved this.")

    stats_apply = await within_limit(redis, char_id, char.age, action_name, cfg["yearly_limit"])

    handler = ACTION_HANDLERS.get(cfg["action_type"])
    if not handler:
        raise HTTPException(status_code=500, detail=f"Unknown action type: {cfg['action_type']}")

    event, base_text = await handler(char, cfg, stats_apply, redis, bg_tasks)

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

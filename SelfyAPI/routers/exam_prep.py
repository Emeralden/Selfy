import random
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.event import LifeEvent
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.services.scenarios import enrich_event

router = APIRouter(prefix="/exam-prep")

# ── Action definitions ────────────────────────────────────────────────────────
EXAM_ACTIONS: dict[str, dict] = {
    "join_coaching": {
        "action_type":         "passive",
        "id":                  "exam_join_coaching",
        "label":               "Join Coaching",
        "description":         "Enroll in JEE/NEET coaching center",
        "emoji":               "🏫",
        "theme":               "green",
        "age_range":           [17, 18],
        "yearly_limit":        1,
        "requires_tag_absent": "Coaching",
        "grants_tag":          "Coaching",
        "title":               "Enrolled! 🏫",
        "text_base":           "The coaching center smells like chalk, ambition, and mild panic. You signed up. The real grind begins now.",
        "tone":                "determined",
        "stat_effects":        {"mind": 3, "grades": 2, "discipline": 2},
    },
    "all_nighter": {
        "action_type":  "roll",
        "id":           "exam_all_nighter",
        "label":        "Pull an All-Nighter",
        "description":  "Stay up till dawn cramming",
        "emoji":        "🌙",
        "theme":        "indigo",
        "age_range":    [17, 18],
        "yearly_limit": 3,
        "tone":         "exhausted",
        # score: mind + discipline + randint(-30, 30) vs 100
        "success_score": 100,
        "success": {
            "title":        "Brain Still Works! 🌙",
            "text_base":    "4 AM. The entire syllabus is somewhere in your head now. Maybe. Your eyes are burning but the mock test tomorrow just got less scary.",
            "stat_effects": {"mind": 4, "grades": 3, "joy": -3, "body": -2},
        },
        "fail": {
            "title":        "You Crashed 😴",
            "text_base":    "You fell asleep at 2 AM on your textbook. You woke up with formulas imprinted on your face. Nothing stuck. Your body gave out before your syllabus did.",
            "stat_effects": {"joy": -2, "body": -3, "grades": -1},
        },
    },
    "group_study": {
        "action_type":  "roll",
        "id":           "exam_group_study",
        "label":        "Group Study",
        "description":  "Hit the books with friends",
        "emoji":        "👥",
        "theme":        "pink",
        "age_range":    [17, 18],
        "yearly_limit": 4,
        "tone":         "collaborative",
        # score: sociability + mind + randint(-30, 30) vs 90
        "success_score": 90,
        "success": {
            "title":        "Actually Studied! 👥",
            "text_base":    "Somehow the group kept each other on track. You taught a concept you barely understood yourself — and suddenly it clicked. Teaching is studying.",
            "stat_effects": {"mind": 3, "grades": 2, "sociability": 2, "joy": 2},
        },
        "fail": {
            "title":        "Productivity: Zero 💀",
            "text_base":    "Three hours. You covered half a chapter and spent the rest gossiping, debating lunch options, and sending memes. No regrets though.",
            "stat_effects": {"joy": 4, "sociability": 2, "grades": -1},
        },
    },
    "take_break": {
        "action_type":  "passive",
        "id":           "exam_take_break",
        "label":        "Take a Break",
        "description":  "Step away and breathe",
        "emoji":        "☕",
        "theme":        "green",
        "age_range":    [17, 18],
        "yearly_limit": 5,
        "title":        "Recharged ☕",
        "text_base":    "You put the pen down. You made chai. You stared out the window for fifteen minutes doing absolutely nothing productive. You needed this more than one more chapter.",
        "tone":         "calm",
        "stat_effects": {"joy": 4, "body": 2, "mind": 1},
    },
    "maggi_point": {
        "action_type":  "passive",
        "id":           "exam_maggi_point",
        "label":        "Sneak Out to Maggi Point",
        "description":  "Midnight maggi run with the crew",
        "emoji":        "🍜",
        "theme":        "orange",
        "age_range":    [17, 18],
        "yearly_limit": 4,
        "title":        "Worth It 🍜",
        "text_base":    "11 PM. The street stall. Butter maggi under a flickering yellow bulb. Your friends, the cold air, and zero syllabus talk. You'll remember this more than any rank.",
        "tone":         "nostalgic",
        "stat_effects": {"joy": 6, "sociability": 3, "discipline": -2, "body": -1},
    },
}


# ── Handlers ──────────────────────────────────────────────────────────────────

def _apply_stats(char: Character, stat_effects: dict) -> None:
    for stat, delta in stat_effects.items():
        current = getattr(char, stat, None)
        if current is not None:
            setattr(char, stat, current + delta)


async def _handle_passive(
    char: Character, cfg: dict, stats_apply: bool,
    redis: RedisDep, bg_tasks: BackgroundTasks,
) -> tuple[dict, str]:
    # Always grant tag on first valid call — tags are not rate-limited
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
    score = (char.mind + char.discipline + random.randint(-30, 30))
    # group_study uses sociability instead of discipline
    if cfg["id"] == "exam_group_study":
        score = (char.sociability + char.mind + random.randint(-30, 30))

    won = score >= cfg.get("success_score", 100)
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
    result = []
    for action_id, cfg in EXAM_ACTIONS.items():
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


@router.delete("/{char_id}/coaching")
async def leave_coaching(char_id: uuid.UUID, session: SessionDep):
    """Remove the Coaching tag — player dropped out of coaching."""
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if "Coaching" not in (char.tags or []):
        raise HTTPException(status_code=400, detail="Not currently enrolled in coaching.")
    char.tags = [t for t in char.tags if t != "Coaching"]
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

    cfg = EXAM_ACTIONS.get(action_name)
    if not cfg:
        raise HTTPException(status_code=400, detail="Invalid exam-prep action.")

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

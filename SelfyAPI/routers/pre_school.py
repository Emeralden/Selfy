import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.models.character import Character
from SelfyAPI.models.event import LifeEvent
from SelfyAPI.services.director import embed_and_save
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.services.scenarios import enrich_event

router = APIRouter(prefix="/pre-school")

MAX_STARS = 5

PRE_SCHOOL_ACTIONS: dict[str, dict] = {
    "draw_weird": {
        "action_type":  "passive",
        "id":           "draw_weird",
        "title":        "Picasso! 🎨",
        "text_base":    "You sat down and drew something delightfully weird. Nobody knew what it was. Everyone loved it.",
        "tone":         "whimsical",
        "stat_effects": {"joy": 1, "mind": 3, "savvy": 2},
        "gives_star":   True,
        "yearly_limit": 3,
    },
    "build_blocks": {
        "action_type":  "choice",
        "yearly_limit": 2,
        "outcomes": {
            "success": {
                "id":        "build_blocks_success",
                "title":     "Tower Master! 🏗️",
                "text_base": "You stacked all five blocks into a perfect tower without dropping a single one. Everyone in the room gasped.",
                "tone":      "triumphant",
                "stat_effects": {"joy": 3, "mind": 2, "savvy": 1, "body": 1},
                "gives_star": True,
            },
            "fail": {
                "id":        "build_blocks_fail",
                "title":     "Kaboom! 💥",
                "text_base": "The tower wobbled, then crashed spectacularly. You learned that gravity always wins — for now.",
                "tone":      "comedic",
                "stat_effects": {"mind": 1, "body": 1},
                "gives_star": False,
            },
        },
    },
    "learn_read": {
        "action_type":  "choice",
        "yearly_limit": 5,
        "outcomes": {
            "correct": {
                "id":        "learn_read_correct",
                "title":     "Good Reading! 📖",
                "text_base": "You looked at the picture and said the right word out loud. Something clicked inside your little brain.",
                "tone":      "proud",
                "stat_effects": {"mind": 4, "savvy": 2},
                "gives_star": True,
            },
            "wrong": {
                "id":        "learn_read_wrong",
                "title":     "Almost! 🤏",
                "text_base": "You guessed wrong, but you tried! And trying is where all learning begins.",
                "tone":      "gentle",
                "stat_effects": {"mind": 1},
                "gives_star": False,
            },
        },
    },
    "school_fest": {
        "action_type":  "choice",
        "yearly_limit": 1,
        "outcomes": {
            "lion": {
                "id":        "school_fest_lion",
                "title":     "ROAR! 🦁",
                "text_base": "You roared so loud during the school play that the teacher dropped her coffee. The crowd went wild.",
                "tone":      "dramatic",
                "stat_effects": {"joy": 3, "appeal": 2, "body": 1},
                "gives_star": True,
            },
            "tree": {
                "id":        "school_fest_tree",
                "title":     "Deeply Rooted 🌳",
                "text_base": "You stood completely still for the whole play. Someone watered you at intermission. You didn't move. Method acting.",
                "tone":      "whimsical",
                "stat_effects": {"joy": 2, "mind": 1, "savvy": 2},
                "gives_star": True,
            },
            "astronaut": {
                "id":        "school_fest_astronaut",
                "title":     "To Infinity! 🚀",
                "text_base": "You launched across the stage, knocked over the backdrop, and landed in the principal's lap. 10/10 performance.",
                "tone":      "epic",
                "stat_effects": {"joy": 4, "mind": 2, "appeal": 1},
                "gives_star": True,
            },
        },
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _star_key(char_id: uuid.UUID, age: int) -> str:
    return f"edu_stars:{char_id}:{age}"


def _apply_stats(char: Character, stat_effects: dict) -> None:
    for stat, delta in stat_effects.items():
        current = getattr(char, stat, None)
        if current is not None:
            setattr(char, stat, current + delta)


# ── Action handlers ───────────────────────────────────────────────────────────

async def _handle_passive(
    char: Character, cfg: dict, stats_apply: bool,
    redis: RedisDep, bg_tasks: BackgroundTasks,
    outcome: str | None,                        # unused, kept for uniform signature
    char_id: uuid.UUID,
) -> tuple[dict, str, int]:
    if stats_apply:
        _apply_stats(char, cfg["stat_effects"])

    key = _star_key(char_id, char.age)
    stars = min(int(await redis.get(key) or 0), MAX_STARS)
    if stats_apply and cfg.get("gives_star") and stars < MAX_STARS:
        stars = min(int(await redis.incr(key)), MAX_STARS)

    event = {"id": cfg["id"], "version": "1.0",
             "text_base": cfg["text_base"], "title": cfg["title"]}
    base_text = cfg["text_base"]
    await enrich_event(event, cfg["tone"], redis, bg_tasks)
    return event, base_text, stars


async def _handle_choice(
    char: Character, cfg: dict, stats_apply: bool,
    redis: RedisDep, bg_tasks: BackgroundTasks,
    outcome: str | None,
    char_id: uuid.UUID,
) -> tuple[dict, str, int]:
    if outcome not in cfg["outcomes"]:
        raise HTTPException(status_code=400, detail="Missing or invalid outcome for this action.")

    picked = cfg["outcomes"][outcome]

    if stats_apply:
        _apply_stats(char, picked["stat_effects"])

    key = _star_key(char_id, char.age)
    stars = min(int(await redis.get(key) or 0), MAX_STARS)
    if stats_apply and picked.get("gives_star") and stars < MAX_STARS:
        stars = min(int(await redis.incr(key)), MAX_STARS)

    event = {"id": picked["id"], "version": "1.0",
             "text_base": picked["text_base"], "title": picked["title"]}
    base_text = picked["text_base"]
    await enrich_event(event, picked["tone"], redis, bg_tasks)
    return event, base_text, stars


ACTION_HANDLERS = {
    "passive": _handle_passive,
    "choice":  _handle_choice,
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{char_id}/stars")
async def get_stars(char_id: uuid.UUID, session: SessionDep, redis: RedisDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    raw = await redis.get(_star_key(char_id, char.age))
    return {"stars": min(int(raw or 0), MAX_STARS)}


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

    cfg = PRE_SCHOOL_ACTIONS.get(action_name)
    if not cfg:
        raise HTTPException(status_code=400, detail="Invalid pre-school action.")

    stats_apply = await within_limit(redis, char_id, char.age, action_name, cfg["yearly_limit"])

    handler = ACTION_HANDLERS.get(cfg["action_type"])
    if not handler:
        raise HTTPException(status_code=500, detail=f"Unknown action type: {cfg['action_type']}")

    event, base_text, stars = await handler(
        char, cfg, stats_apply, redis, bg_tasks, outcome, char_id
    )

    log_entry = LifeEvent(char_id=char_id, age=char.age, text=base_text)
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
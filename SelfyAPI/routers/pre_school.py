"""Pre-school router — uses the standard action factory + a star-tracking hook."""

import uuid

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.routers.actions import make_action_router
from SelfyAPI.routers.utils import get_char_or_404

MAX_STARS = 5


def _star_key(char_id: uuid.UUID, age: int) -> str:
    return f"edu_stars:{char_id}:{age}"


async def _track_stars(response, char, redis, stats_apply):
    """Post-resolve hook: increment star counter if the action gives one."""
    key = _star_key(char.id, char.age)
    stars = min(int(await redis.get(key) or 0), MAX_STARS)
    if stats_apply and response.get("gives_star") and stars < MAX_STARS:
        stars = min(int(await redis.incr(key)), MAX_STARS)
    response["stars"] = stars
    return response


router = make_action_router(
    "pre-school", "preschool",
    result_fields=["gives_star"],
    post_resolve=_track_stars,
)


@router.get("/{char_id}/stars")
async def get_stars(char_id: uuid.UUID, session: SessionDep, redis: RedisDep):
    char = get_char_or_404(session, char_id)
    raw = await redis.get(_star_key(char_id, char.age))
    return {"stars": min(int(raw or 0), MAX_STARS)}
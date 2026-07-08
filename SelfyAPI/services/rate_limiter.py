import uuid


async def within_limit(redis, char_id: uuid.UUID, age: int, action_key: str, limit: int) -> bool:
    """
    Generic per-action, per-year rate limiter backed by Redis.

    Returns True  → caller is within limit; counter has been incremented.
    Returns False → limit already reached; no increment, no stat changes.

    The key includes `age`, so it resets automatically on age-up with
    zero extra code — the old key just becomes irrelevant.

    Args:
        redis:      Async Redis client.
        char_id:    Character UUID.
        age:        Character's current age (used as the year bucket).
        action_key: Stable string identifying the action (e.g. "draw_weird").
        limit:      Max times stats apply per year. 0 = unlimited.
    """
    if limit <= 0:
        return True

    key = f"rate:{char_id}:{age}:{action_key}"
    count = int(await redis.get(key) or 0)

    if count >= limit:
        return False

    await redis.incr(key)
    return True

from SelfyAPI.services.engine.dispatcher import subscribe_age_up


# \u2500\u2500 Wave 5: redis cleanup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

@subscribe_age_up(priority=900, wave=5)
async def process_redis_cleanup(snapshot, session, redis, bg_tasks, log_memory):
    """Clear per-age rate-limit keys. Pushed to background — never blocks the response."""
    char_id = snapshot["id"]

    async def _cleanup():
        import asyncio
        await asyncio.gather(
            redis.delete(f"char:{char_id}:school"),
            redis.delete(f"cooldowns:{char_id}"),
        )

    bg_tasks.add_task(_cleanup)
    return None  # no char mutations, no apply phase needed
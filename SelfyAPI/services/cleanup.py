from SelfyAPI.services.engine.dispatcher import subscribe_age_up
from SelfyAPI.models.character import Stage

@subscribe_age_up(priority=900)
async def process_redis_cleanup(char, session, redis, bg_tasks, log_memory):

    await redis.delete(f"char:{char.id}:school")
    await redis.delete(f"cooldowns:{char.id}")
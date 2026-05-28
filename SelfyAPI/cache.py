from upstash_redis.asyncio import Redis
from .config import settings

redis_client = Redis(
    url=settings.redis_url,
    token=settings.redis_token
)

async def get_redis():
    yield redis_client
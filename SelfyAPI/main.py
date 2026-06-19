from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from SelfyAPI import database
from SelfyAPI.cache import redis_client
from SelfyAPI.dependencies import RedisDep
from SelfyAPI.routers import auth, life, social, school, character

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.create_db_and_tables()
    print("Connecting to Redis...")
    try:
        await redis_client.ping()
        print("Connected to Redis")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
    yield


app = FastAPI(title="Selfy",
              lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://selfy-web.vercel.app",
    ],
    allow_origin_regex=r"https://selfy-web.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"Hello": "Welcome to Selfy"}

@app.get("/ping-redis")
async def ping_redis(redis: RedisDep):
    await redis.set("redis", "ready")
    value = await redis.get("redis")
    return {"redis": value}

app.include_router(life.router, tags=["Lifecycle"])
app.include_router(social.router, tags=["Social"])
app.include_router(school.router, tags=["Education"])
app.include_router(character.router, tags=["Character"])
app.include_router(auth.router, tags=["Security"])
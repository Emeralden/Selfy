from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from SelfyAPI import database
from SelfyAPI.cache import redis_client
from SelfyAPI.dependencies import RedisDep
from SelfyAPI.routers import auth, pre_school, life, social, character, school, exam_prep
from SelfyAPI.routers import self as self_router
from SelfyAPI.services.engine import client as engine

import SelfyAPI.services.aging
import SelfyAPI.services.cleanup
import SelfyAPI.services.scenarios

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.create_db_and_tables()
    print("Connecting to Redis...")
    try:
        await redis_client.ping()
        print("Connected to Redis")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
    await engine.startup()
    print("Engine HTTP client ready")
    yield
    await engine.shutdown()
    print("Engine HTTP client closed")


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

app.include_router(self_router.router, tags=["Self"])
app.include_router(life.router,      tags=["Lifecycle"])
app.include_router(social.router,    tags=["Social"])
app.include_router(pre_school.router, tags=["Pre-School"])
app.include_router(school.router,     tags=["School"])
app.include_router(exam_prep.router,  tags=["Exam-Prep"])
app.include_router(character.router, tags=["Character"])
app.include_router(auth.router,      tags=["Security"])
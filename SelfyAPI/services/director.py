import asyncio
import json
from uuid import UUID

import google.genai as genai
from google.genai import types
from sqlmodel import Session, select

from ..config import settings
from ..database import engine
from ..dependencies import SessionDep
from ..models.event import LifeEvent

client = genai.Client(api_key=settings.gemini_api_key)
embedding_model = "gemini-embedding-2"
director_model = "gemini-3.1-flash-lite"


def _director_prompt(event_trigger: str, age: int, context: str) -> str:
    return f"""You are the twisted, chaotic Game Director for a life simulator game.
Your job is to generate a dramatic life scenario and 3/4 actionable choices for the player.

CURRENT EVENT TRIGGER: {event_trigger}
PLAYER AGE: {age}

PAST MEMORIES (RAG CONTEXT): {context}

INSTRUCTIONS:
1. Read the PAST MEMORIES. If they are relevant, use them to create the present scenario!
   Make the NPCs hold grudges or remember favors.
2. If the memories are blank or irrelevant, ignore them.
3. Output EXACTLY 1 short scenario (max 2 sentences) and 3/4 distinct choices.
4. Format your output strictly as JSON.

Format: {{"scenario": "Your text here...", "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4 if needed"]}}"""

def _eulogy_prompt(name: str, age: int, context: str) -> str:
    return f"""You are the epitaph writer at the funeral of {name}, who died at age {age}.
Write a brutal, honest, yet beautifully poetic 2-paragraph eulogy. Keep it short and concise.

LIFETIME MEMORIES (RAG CONTEXT): {context}

INSTRUCTIONS:
1. Weave their past memories into the speech. Call out their specific failures and successes.
2. If they lived a boring life, roast them for playing it too safe.
3. Output plain text. NO JSON.
"""

async def embed_memory(text: str) -> list[float]:
    """Embed a text string using Gemini Embedding 2 and return raw floats."""
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.embed_content(
            model=embedding_model,
            contents=text,
        )
    )
    return list(response.embeddings[0].values)


async def embed_and_save(event_id: UUID) -> None:
    # 1. Grab text, then immediately release the connection
    with Session(engine) as session:
        event = session.get(LifeEvent, event_id)
        if event is None or event.embedding is not None:
            return
        text = event.text

    # 2. Call Gemini — no DB connection held during this await
    embedding = await embed_memory(text)

    # 3. Write back with a fresh, short-lived session
    with Session(engine) as session:
        event = session.get(LifeEvent, event_id)
        if event is not None:
            event.embedding = embedding
            session.add(event)
            session.commit()


async def recall_trauma(char_id: UUID, current_event: str, session: SessionDep) -> str:
    new_embedding = await embed_memory(current_event)

    results = session.exec(
        select(LifeEvent)
        .where(LifeEvent.char_id == char_id)
        .where(LifeEvent.embedding.is_not(None))
        .order_by(LifeEvent.embedding.cosine_distance(new_embedding))
        .limit(3)
    ).all()

    return "\n".join(event.text for event in results)


async def generate_scenario(
    char_id: UUID,
    event_trigger: str,
    age: int,
    session: SessionDep,
) -> dict:
    context = await recall_trauma(char_id, event_trigger, session)
    prompt = _director_prompt(event_trigger, age, context or "No relevant memories yet.")

    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=director_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        ).text
    )

    return json.loads(raw)

async def generate_eulogy(char_id: UUID, name: str, age: int, session: SessionDep) -> str:
    search_query = "greatest achievements, worst mistakes, family trauma, legacy"
    context = await recall_trauma(char_id, search_query, session)
    
    prompt = _eulogy_prompt(name, age, context or "They did literally nothing of note.")

    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=director_model,
            contents=prompt,
        ).text
    )
    return raw
import uuid
from typing import List

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from SelfyAPI.models.npc import NPC

from ..dependencies import SessionDep
from ..models.character import Character
from ..models.event import LifeEvent
from ..schemas.event import LifeEventRead

router = APIRouter(prefix="/character")

@router.get("/{char_id}", response_model=Character)
async def get_char(char_id: uuid.UUID, session:SessionDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    return char

@router.get("/{char_id}/events", response_model=List[LifeEventRead])
async def get_events(char_id: uuid.UUID, session: SessionDep):
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")

    query = (
        select(LifeEvent)
        .where(LifeEvent.char_id == char_id)
        .order_by(col(LifeEvent.age))
    )

    events = session.exec(query).all()

    return events


@router.get("/{char_id}/npcs", response_model=List[NPC])
async def get_npcs(char_id: uuid.UUID, session: SessionDep):

    query = select(NPC).where(NPC.char_id == char_id)

    family = session.exec(query).all()

    return family

@router.get("/{char_id}/npcs/{npc_id}", response_model=NPC)
async def get_npc(char_id:uuid.UUID, npc_id: uuid.UUID, session: SessionDep):

    query = select(NPC).where(NPC.char_id == char_id, NPC.id == npc_id)

    npc = session.exec(query).first()

    return npc
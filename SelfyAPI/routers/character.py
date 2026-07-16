import uuid
from typing import List

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from SelfyAPI.models.npc import NPC

from ..dependencies import SessionDep, UserDep
from ..models.character import Character
from ..models.event import LifeEvent
from ..schemas.event import LifeEventRead

router = APIRouter(prefix="/character")


# ── Must be defined BEFORE /{char_id} routes so FastAPI doesn't
#    treat "shelve" / "saved" as a char_id path parameter ──────────────────────

@router.post("/shelve")
async def shelve_character(session: SessionDep, user: UserDep):
    """Park the current active character without deleting it.
    Sets active_character_id = None so the user can start a fresh life."""
    if not user.active_character_id:
        raise HTTPException(status_code=400, detail="No active character to shelve.")
    user.active_character_id = None
    session.add(user)
    session.commit()
    return {"message": "Character shelved. Start a new life!"}


@router.get("/saved", response_model=List[Character])
async def get_saved_characters(session: SessionDep, user: UserDep):
    """Return all alive characters belonging to this user that are NOT currently active."""
    query = (
        select(Character)
        .where(
            Character.user_id == user.id,
            Character.alive == True,
            Character.id != user.active_character_id,
        )
    )
    saved = session.exec(query).all()
    return saved


@router.post("/{char_id}/resume")
async def resume_character(char_id: uuid.UUID, session: SessionDep, user: UserDep):
    """Switch the active character.

    The previously active character is automatically saved — it stays alive
    in the database and will appear in GET /character/saved going forward.
    """
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if char.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your character.")
    if not char.alive:
        raise HTTPException(status_code=400, detail="Cannot resume a dead character.")
    if str(char.id) == str(user.active_character_id):
        raise HTTPException(status_code=400, detail="This character is already active.")

    # Explicitly shelve the current active character (sets pointer to None first)
    # so it becomes queryable as a saved life immediately after this call.
    previous_id = user.active_character_id
    user.active_character_id = None
    session.add(user)
    session.flush()  # write None without committing yet

    # Now activate the requested character
    user.active_character_id = char.id
    session.add(user)
    session.commit()

    saved_name = None
    if previous_id:
        prev = session.get(Character, previous_id)
        if prev:
            saved_name = f"{prev.first_name} {prev.last_name}"

    return {
        "message": f"Resumed {char.first_name} {char.last_name}!",
        "saved_previous": saved_name,
    }


@router.delete("/{char_id}/delete")
async def delete_character(char_id: uuid.UUID, session: SessionDep, user: UserDep):
    """Permanently delete a saved (non-active) character and all its data."""
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    if char.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your character.")
    if user.active_character_id and str(user.active_character_id) == str(char_id):
        raise HTTPException(status_code=400, detail="Cannot delete your active character. Shelve it first.")
    session.delete(char)
    session.commit()
    return {"message": f"{char.first_name} {char.last_name}'s life has been erased."}


# ── Parameterised routes ───────────────────────────────────────────────────────

@router.get("/{char_id}", response_model=Character)
async def get_char(char_id: uuid.UUID, session: SessionDep):
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
async def get_npc(char_id: uuid.UUID, npc_id: uuid.UUID, session: SessionDep):
    query = select(NPC).where(NPC.char_id == char_id, NPC.id == npc_id)
    npc = session.exec(query).first()
    return npc
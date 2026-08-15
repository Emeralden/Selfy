import uuid
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

import sqlalchemy as sa
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from .character import Character, Gender


class NPCRole(str, Enum):
    FATHER = "Father"
    MOTHER = "Mother"
    CLASSMATE = "Classmate"
    TEACHER = "Teacher"
    RIVAL_COUSIN = "Rival_Cousin"
    NOSY_AUNT = "Nosy_Aunt"


class NPC(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    char_id: uuid.UUID = Field(foreign_key="character.id", index=True)

    first_name: str
    last_name: str
    age: int
    gender: Gender
    role: NPCRole = Field(
        sa_column=Column(
            sa.Enum(NPCRole, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        )
    )
    alive: bool = Field(default=True)

    temperament: int = Field(default=50)
    resentment: int = Field(default=50)

    affection: int = Field(default=50)
    trust: int = Field(default=50)
    respect: int = Field(default=50)

    relation_label: str = Field(default="Neutral")

    is_significant: bool = Field(default=False)

    tags: List[str] = Field(default=[], sa_column=Column(JSON))

    avatar_url: str | None = Field(default=None)

    character: Character = Relationship(back_populates="npcs")

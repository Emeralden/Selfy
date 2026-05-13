import uuid
from enum import Enum
from typing import TYPE_CHECKING, Any, List

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .npc import NPC


class Sexuality(str, Enum):
    STRAIGHT = "Straight"
    GAY = "Gay"
    BISEXUAL = "Bisexual"
    ASEXUAL = "Asexual"
    QUESTIONING = "Questioning"


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"

class Stage(str, Enum):
    NEWBORN = "Newborn"
    CHILDHOOD = "Childhood"
    HIGH_SCHOOL = "High School"
    COLLEGE = "College"
    ADULT = "Adult"
    ELDER = "Elder"

class CharacterCreate(SQLModel):
    user_id: uuid.UUID
    country: str
    gender: Gender

class Character(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    first_name: str = Field(default="Ganesh")
    last_name: str = Field(default="Maharaj")
    gender: Gender
    country: str = Field(default="IN")
    state: str = Field(default="Kerala")
    age: int = Field(default=0)
    stage: Stage = Field(default=Stage.NEWBORN)
    alive: bool = Field(default=True)
    money: int = Field(default=0)

    body: int = Field(default=65)
    mind: int = Field(default=35)
    joy: int = Field(default=40)
    appeal: int = Field(default=75)
    savvy: int = Field(default=25)

    composure: int = Field(default=30)
    neuroticism: int = Field(default=50)
    sexuality: Sexuality = Field(default=Sexuality.STRAIGHT)
    fertility: int = Field(default=80)
    immunity: int = Field(default=70)
    metabolism: int = Field(default=50)

    discipline: int = Field(default=50)
    empathy: int = Field(default=40)
    sociability: int = Field(default=45)
    karma: int = Field(default=85)
    hubris: int = Field(default=25)
    avarice: int = Field(default=20)

    echoes: list[dict[str, Any]] = Field(default=[], sa_column=Column(JSON))

    npcs: list["NPC"] = Relationship(
        back_populates="character",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    contextual: dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    class Config:
        from_attributes = True

class ActionRequest(SQLModel):
    action: str
    npc_id: uuid.UUID

import uuid
from enum import Enum
from typing import TYPE_CHECKING, Any, List

import sqlalchemy as sa
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .npc import NPC


class Sexuality(str, Enum):
    STRAIGHT = "Straight"
    GAY = "Gay"
    BISEXUAL = "Bisexual"
    ASEXUAL = "Asexual"
    QUESTIONING = "Questioning"


class MaritalStatus(str, Enum):
    SINGLE = "Single"
    RELATIONSHIP = "Relationship"
    MARRIED = "Married"
    DIVORCED = "Divorced"
    WIDOWED = "Widowed"


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"

class Stage(str, Enum):
    BABY = "Baby"
    TODDLER = "Toddler"
    PRE_SCHOOL = "Pre-School"
    SCHOOL = "School"
    EXAM_PREP = "Exam-Prep"
    UNIVERSITY = "University"
    ADULT = "Adult"
    ELDER = "Elder"

class CharacterCreate(SQLModel):
    user_id: uuid.UUID | None = None
    first_name: str
    last_name: str
    country: str
    state: str
    gender: Gender

# All int stats that must stay within [0, 100]
STAT_FIELDS = {
    "body", "mind", "joy", "appeal", "savvy",
    "fertility", "immunity",
    "discipline", "sociability", "karma",
    "grades",
}

class Character(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)

    first_name: str
    last_name: str
    gender: Gender
    country: str
    state: str
    age: int = Field(default=0)
    stage: Stage = Field(
        default=Stage.BABY,
        sa_column=Column(
            sa.Enum(Stage, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    alive: bool = Field(default=True)
    money: int = Field(default=0)

    body: int = Field(default=65)
    mind: int = Field(default=35)
    joy: int = Field(default=40)
    appeal: int = Field(default=75)
    savvy: int = Field(default=25)

    sexuality: Sexuality = Field(default=Sexuality.STRAIGHT)
    marital_status: MaritalStatus = Field(
        default=MaritalStatus.SINGLE,
        sa_column=Column(
            sa.Enum(MaritalStatus, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    fertility: int = Field(default=80)
    immunity: int = Field(default=70)

    discipline: int = Field(default=50)
    sociability: int = Field(default=45)
    karma: int = Field(default=85)

    npcs: list["NPC"] = Relationship(
        back_populates="character",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    grades: int = Field(default=50)

    tags: List[str] = Field(default=[], sa_column=Column(JSON))

    class Config:
        from_attributes = True

    def __setattr__(self, name: str, value: Any) -> None:
        if name in STAT_FIELDS and isinstance(value, int):
            value = max(0, min(100, value))
        super().__setattr__(name, value)

class ActionRequest(SQLModel):
    action: str
    npc_id: uuid.UUID

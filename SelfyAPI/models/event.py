from datetime import datetime, timezone
import uuid

from sqlmodel import Column, Field, SQLModel

from ..db_types import FloatVector


class LifeEvent(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    char_id: uuid.UUID = Field(foreign_key="character.id", index=True)
    age: int
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    embedding: list[float] | None = Field(default=None, sa_column=Column(FloatVector(3072)))
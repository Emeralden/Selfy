from datetime import datetime, timezone
import uuid

from sqlmodel import Field, SQLModel


class LifeEvent(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    char_id: uuid.UUID = Field(foreign_key="character.id", index=True)
    age: int
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
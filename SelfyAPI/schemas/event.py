import uuid
from datetime import datetime

from sqlmodel import SQLModel


class LifeEventRead(SQLModel):
    """Public API shape for a LifeEvent — never exposes the embedding vector."""
    id: uuid.UUID
    char_id: uuid.UUID
    age: int
    text: str
    created_at: datetime

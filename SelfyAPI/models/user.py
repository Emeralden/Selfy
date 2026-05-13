from datetime import datetime, timezone

from sqlmodel import SQLModel, Field
import uuid
from typing import Optional

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    active_character_id: Optional[uuid.UUID] = Field(default=None)


    






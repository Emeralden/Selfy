import sqlmodel
from .config import settings

from .models.user import User
from .models.character import Character
from .models.event import LifeEvent
from .models.npc import NPC

engine = sqlmodel.create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
)

def create_db_and_tables():
    sqlmodel.SQLModel.metadata.create_all(engine)

def get_session():
    with sqlmodel.Session(engine) as session:
        yield session

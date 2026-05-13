import sqlmodel
from .config import settings

from .models.user import User
from .models.character import Character
from .models.event import LifeEvent
from .models.npc import NPC

is_sqlite = settings.database_url.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

if is_sqlite:
    print("Running in SQLite Mode")
else:
    print("Running in PostgreSQL Mode.")

engine = sqlmodel.create_engine(
    settings.database_url,
    connect_args=connect_args,
)

def create_db_and_tables():
    sqlmodel.SQLModel.metadata.create_all(engine)

def get_session():
    with sqlmodel.Session(engine) as session:
        yield session

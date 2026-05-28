from typing import Annotated

from fastapi import Depends
from redis import Redis
import sqlmodel

from SelfyAPI.cache import get_redis
from SelfyAPI.database import get_session

SessionDep = Annotated[sqlmodel.Session, Depends(get_session)]

RedisDep = Annotated[Redis, Depends(get_redis)]

from SelfyAPI.security import get_current_user
from SelfyAPI.models.user import User
UserDep = Annotated[User, Depends(get_current_user)]

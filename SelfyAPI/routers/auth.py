from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from SelfyAPI.dependencies import SessionDep, UserDep
from SelfyAPI.models.user import User, UserCreate
from SelfyAPI.security import hash_password, verify_password, create_access_token, create_refresh_token
import jwt
from SelfyAPI.config import settings

router = APIRouter(prefix="/auth")

@router.post("/register")
def register(user_in: UserCreate, session: SessionDep):
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bro, username is taken!")
        
    hashed = hash_password(user_in.password)

    new_user = User(username=user_in.username, hashed_password=hashed)
    session.add(new_user)
    session.commit()

    return {"message": "Account created!", "username": new_user.username}

@router.post("/login")
def log_in(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep, response: Response):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token  = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=900
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60
    )

    return {"message": "Logged in securely!"}

@router.get("/me")
async def get_me(user: UserDep):
    return {
        "username": user.username,
        "active_character_id": str(user.active_character_id) if user.active_character_id else None,
    }

@router.post("/refresh")
def refresh(request: Request, response: Response, session: SessionDep):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = jwt.decode(refresh_token, settings.secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    username = payload.get("sub")
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token(data={"sub": user.username})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {new_access_token}",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=900
    )

    return {"message": "Access token refreshed!"}

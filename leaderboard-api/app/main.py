from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from .database import engine, Base, get_db
from .models import User, Score
from .schemas import TokenResponse, SubmitScoreRequest, ScoreEntry, AdminResetRequest
from .auth import hash_password, verify_password, create_token, decode_token

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(authorization.removeprefix("Bearer "))
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.post("/auth/register", response_model=TokenResponse)
async def register(
    username: Annotated[str, Form()],
    password: Annotated[SecretStr, Form()],
    db: AsyncSession = Depends(get_db),
):
    username = username.strip()
    if not username or len(username) > 32:
        raise HTTPException(status_code=422, detail="Username must be 1–32 characters")
    if len(password.get_secret_value()) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    existing = await db.scalar(select(User).where(User.username == username))
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_token(user.id, user.username),
        username=user.username,
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(
    username: Annotated[str, Form()],
    password: Annotated[SecretStr, Form()],
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.username == username))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return TokenResponse(
        access_token=create_token(user.id, user.username),
        username=user.username,
    )


@app.post("/leaderboard/submit", status_code=204)
async def submit_score(
    req: SubmitScoreRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    score = await db.scalar(
        select(Score).where(Score.user_id == user.id, Score.level_id == req.level_id)
    )
    if not score:
        db.add(Score(user_id=user.id, level_id=req.level_id, first_time_ms=req.time_ms))
    await db.commit()


@app.get("/leaderboard", response_model=list[ScoreEntry])
async def get_leaderboard(level_id: int, db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(User.username, Score.level_id, Score.first_time_ms)
        .join(Score, Score.user_id == User.id)
        .where(Score.level_id == level_id)
        .order_by(Score.first_time_ms)
    )
    return [
        ScoreEntry(
            username=r.username,
            level_id=r.level_id,
            first_time_ms=r.first_time_ms,
        )
        for r in rows
    ]


@app.post("/admin/reset-password", status_code=204)
async def reset_password(
    req: AdminResetRequest,
    x_admin_secret: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await db.scalar(select(User).where(User.username == req.username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(req.new_password)
    await db.commit()

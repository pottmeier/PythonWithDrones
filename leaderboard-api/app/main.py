import secrets
from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Header, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import SecretStr
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import os

from .database import engine, Base, get_db
from .models import User, Score, Attempt
from .schemas import (
    TokenResponse,
    SubmitScoreRequest,
    ScoreEntry,
    AttemptEntry,
    AdminResetRequest,
)
from .auth import hash_password, verify_password, create_token, decode_token

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,https://pottmeier.github.io"
    ).split(",")
    if origin.strip()
]

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if engine.dialect.name == "postgresql":
            await conn.execute(text("ALTER TABLE scores ADD COLUMN IF NOT EXISTS steps INTEGER"))
            await conn.execute(text("ALTER TABLE scores ADD COLUMN IF NOT EXISTS lines_of_code INTEGER"))
    yield


app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
@limiter.limit("10/minute")
async def register(
    request: Request,
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
@limiter.limit("10/minute")
async def login(
    request: Request,
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
    db.add(Attempt(
        user_id=user.id,
        level_id=req.level_id,
        time_ms=req.time_ms,
        steps=req.steps,
        lines_of_code=req.lines_of_code,
    ))
    score = await db.scalar(
        select(Score).where(Score.user_id == user.id, Score.level_id == req.level_id)
    )
    if not score:
        db.add(Score(
            user_id=user.id,
            level_id=req.level_id,
            first_time_ms=req.time_ms,
            steps=req.steps,
            lines_of_code=req.lines_of_code,
        ))
    await db.commit()


@app.get("/leaderboard", response_model=list[ScoreEntry])
async def get_leaderboard(level_id: int, db: AsyncSession = Depends(get_db)):
    NULL_SENTINEL = 2_147_483_647
    rows = await db.execute(
        select(
            User.username,
            Score.level_id,
            Score.first_time_ms,
            Score.steps,
            Score.lines_of_code,
            Score.created_at,
        )
        .join(Score, Score.user_id == User.id)
        .where(Score.level_id == level_id)
        .order_by(
            func.coalesce(Score.steps, NULL_SENTINEL),
            Score.first_time_ms,
            func.coalesce(Score.lines_of_code, NULL_SENTINEL),
        )
    )
    return [
        ScoreEntry(
            username=r.username,
            level_id=r.level_id,
            first_time_ms=r.first_time_ms,
            steps=r.steps,
            lines_of_code=r.lines_of_code,
            created_at=r.created_at,
        )
        for r in rows
    ]


@app.get("/leaderboard/history", response_model=list[AttemptEntry])
async def get_history(
    level_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(Attempt)
        .where(Attempt.user_id == user.id, Attempt.level_id == level_id)
        .order_by(Attempt.id)
    )
    return [
        AttemptEntry(
            time_ms=a.time_ms,
            steps=a.steps,
            lines_of_code=a.lines_of_code,
            created_at=a.created_at,
        )
        for a in rows.scalars()
    ]


@app.post("/admin/reset-password", status_code=204)
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    req: AdminResetRequest,
    x_admin_secret: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not ADMIN_SECRET or not secrets.compare_digest(x_admin_secret or "", ADMIN_SECRET):
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await db.scalar(select(User).where(User.username == req.username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(req.new_password)
    await db.commit()

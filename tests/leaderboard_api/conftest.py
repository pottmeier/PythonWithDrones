"""
Test harness for leaderboard-api/app (a FastAPI service backed by async
SQLAlchemy + Postgres in production).

app.database reads DATABASE_URL from the environment at import time, so a
placeholder must be set before anything imports app.main/app.database.
Each test then gets its own throwaway sqlite-backed database, injected via
a FastAPI dependency override on get_db -- the endpoints and business
logic run completely unmodified against it.
"""

import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("ADMIN_SECRET", "test-admin-secret")

API_DIR = Path(__file__).resolve().parents[2] / "leaderboard-api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app


@pytest_asyncio.fixture
async def db_session_factory(tmp_path):
    """A throwaway sqlite database, isolated per test via a temp file."""
    db_path = tmp_path / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    yield session_factory
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session_factory):
    async def override_get_db():
        async with db_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_user(client):
    """Register a user and return their username/password/access_token."""
    username, password = "alice", "hunter22"
    resp = await client.post("/auth/register", data={"username": username, "password": password})
    assert resp.status_code == 200
    return {"username": username, "password": password, "token": resp.json()["access_token"]}


@pytest_asyncio.fixture
async def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}

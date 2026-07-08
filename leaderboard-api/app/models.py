from sqlalchemy import (
    Column, Integer, String, Boolean, BigInteger,
    DateTime, ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    # Not unique=True here -- uniqueness is enforced case-insensitively via
    # the functional index below instead, so "Alice" and "alice" collide.
    username = Column(String(32), nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_users_username_lower", func.lower(username), unique=True),
    )


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level_id = Column(Integer, nullable=False)
    first_time_ms = Column(BigInteger, nullable=False)
    steps = Column(Integer, nullable=True)
    lines_of_code = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "level_id", name="uq_user_level"),)


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level_id = Column(Integer, nullable=False)
    time_ms = Column(BigInteger, nullable=False)
    steps = Column(Integer, nullable=False)
    lines_of_code = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_attempts_user_level", "user_id", "level_id"),)

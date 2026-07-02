from datetime import datetime
from pydantic import BaseModel, Field, SecretStr, field_validator


class TokenResponse(BaseModel):
    access_token: str
    username: str


class SubmitScoreRequest(BaseModel):
    level_id: int
    time_ms: int
    steps: int = Field(ge=0)
    lines_of_code: int = Field(ge=0)


class ScoreEntry(BaseModel):
    username: str
    level_id: int
    first_time_ms: int
    steps: int | None = None
    lines_of_code: int | None = None
    created_at: datetime


class AttemptEntry(BaseModel):
    time_ms: int
    steps: int
    lines_of_code: int
    created_at: datetime


class AdminResetRequest(BaseModel):
    username: str
    new_password: SecretStr

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, v: SecretStr) -> SecretStr:
        if len(v.get_secret_value()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

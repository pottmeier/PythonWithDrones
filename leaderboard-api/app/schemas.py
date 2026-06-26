from pydantic import BaseModel, SecretStr, field_validator


class TokenResponse(BaseModel):
    access_token: str
    username: str


class SubmitScoreRequest(BaseModel):
    level_id: int
    time_ms: int


class ScoreEntry(BaseModel):
    username: str
    level_id: int
    first_time_ms: int


class AdminResetRequest(BaseModel):
    username: str
    new_password: SecretStr

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, v: SecretStr) -> SecretStr:
        if len(v.get_secret_value()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

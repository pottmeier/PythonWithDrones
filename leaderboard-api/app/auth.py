from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from jose import jwt
from pydantic import SecretStr
import os

SECRET_KEY = os.environ.get("JWT_SECRET", "changeme")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

_ph = PasswordHasher()


def hash_password(password: SecretStr) -> str:
    return _ph.hash(password.get_secret_value())


def verify_password(plain: SecretStr, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain.get_secret_value())
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_token(user_id: int, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": str(user_id), "username": username, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

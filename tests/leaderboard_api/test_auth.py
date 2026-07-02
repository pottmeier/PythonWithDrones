"""Tests for leaderboard-api/app/auth.py -- password hashing and JWT tokens."""

import pytest
from jose import JWTError
from pydantic import SecretStr

from app.auth import create_token, decode_token, hash_password, verify_password


class TestPasswordHashing:
    def test_verify_correct_password(self):
        hashed = hash_password(SecretStr("hunter2"))
        assert verify_password(SecretStr("hunter2"), hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password(SecretStr("hunter2"))
        assert verify_password(SecretStr("wrong"), hashed) is False

    def test_hash_is_not_the_plaintext(self):
        hashed = hash_password(SecretStr("hunter2"))
        assert hashed != "hunter2"

    def test_verify_against_garbage_hash_is_false(self):
        assert verify_password(SecretStr("hunter2"), "not-a-real-hash") is False


class TestTokens:
    def test_roundtrip(self):
        token = create_token(42, "alice")
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["username"] == "alice"

    def test_tampered_token_is_rejected(self):
        token = create_token(1, "bob")
        tampered = token[:-1] + ("A" if token[-1] != "A" else "B")
        with pytest.raises(JWTError):
            decode_token(tampered)

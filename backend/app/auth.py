"""Password protection for Statedash.

While no password is set the app stays open (authentication disabled).
The hash and sessions never leave the server; the API only exposes whether one is set.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time

from . import settings

COOKIE = "statedash_session"
SESSION_TTL = 30 * 24 * 3600  # 30 days

_sessions: dict[str, float] = {}  # token -> expiry timestamp


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt_hex, digest_hex = stored.split("$")
        if algo != "scrypt":
            return False
        digest = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex), n=2 ** 14, r=8, p=1, dklen=32
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


def enabled() -> bool:
    return bool(settings.get_secret("password_hash"))


def set_password(password: str) -> None:
    settings.set_secret("password_hash", hash_password(password) if password else "")
    if not password:
        _sessions.clear()


def check_password(password: str) -> bool:
    stored = settings.get_secret("password_hash")
    return bool(stored) and verify_password(password, stored)


def create_session() -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = time.time() + SESSION_TTL
    return token


def drop_session(token: str | None) -> None:
    if token:
        _sessions.pop(token, None)


def valid_session(token: str | None) -> bool:
    if not token:
        return False
    expires = _sessions.get(token)
    if expires is None:
        return False
    if expires < time.time():
        _sessions.pop(token, None)
        return False
    return True

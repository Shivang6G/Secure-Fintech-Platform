from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from app.core.config import get_settings

ALGORITHM = "HS256"

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)

def hash_password(password: str) -> str:
    return hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return hasher.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

def create_access_token(claims: dict, expires_delta: timedelta = timedelta(hours=24)) -> str:
    payload = claims.copy()
    now = datetime.now(timezone.utc)
    payload.update({"iat": now, "exp": now + expires_delta})
    return jwt.encode(payload, get_settings().JWT_SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str) -> dict:
    return jwt.decode(token, get_settings().JWT_SECRET_KEY, algorithms=[ALGORITHM])

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Secure FinTech Operating Platform"
    API_V1_STR: str = "/api/v1"

    # Local/Docker Compose mode: a single connection string.
    DATABASE_URL: str = "postgresql+asyncpg://engine_admin:local_dev_secret_password@localhost:5432/fintech_engine"

    # AWS/ECS mode: individual parts injected via task-definition environment
    # variables and Secrets Manager. When DB_HOST is present, `database_url`
    # below assembles the connection string from these instead of DATABASE_URL.
    DB_HOST: Optional[str] = None
    DB_PORT: str = "5432"
    DB_NAME: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None

    REDIS_URL: str = "redis://localhost:6379/0"

    # HS256 JWT signing secret. MUST be overridden via env var / Secrets
    # Manager in any non-local environment - the default below is for local
    # `docker compose up` convenience only.
    JWT_SECRET_KEY: str = "local_dev_only_change_me_in_every_other_environment"

    LOCAL_KEK_HEX: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        if self.DB_HOST and self.DB_NAME and self.DB_USER and self.DB_PASSWORD:
            return (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        return self.DATABASE_URL

@lru_cache
def get_settings():
    return Settings()

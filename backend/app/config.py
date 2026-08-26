from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+psycopg://nook:nook@localhost:5432/nook"
    secret_key: str = "change-me-to-a-long-random-string"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    cookie_secure: bool = False
    import_max_bytes: int = 5 * 1024 * 1024
    metadata_timeout_seconds: float = 5.0
    metadata_max_bytes: int = 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cookie_secure_flag(self) -> bool:
        return self.cookie_secure or self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()

from __future__ import annotations
from pathlib import Path
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # directories (overridable via env vars)
    BASE_DIR: Path = _BASE_DIR
    UPLOAD_DIR: Path = _BASE_DIR / "uploads"
    CONVERTED_DIR: Path = _BASE_DIR / "converted"
    FRONTEND_DIST: Path = _BASE_DIR / "frontend" / "dist"

    # limits
    MAX_FILE_SIZE: int = 300 * 1024 * 1024   # 300 MB
    MAX_WORKERS: int = 4

    SESSION_TTL_HOURS: float = 6.0
    CLEANUP_INTERVAL_SECONDS: float = 3600.0

    # CORS — override with a comma-separated string in .env, e.g.:
    #   CORS_ORIGINS=https://myapp.com,https://www.myapp.com
    CORS_ORIGINS: List[str] = ["*"]

    # logging
    LOG_FORMAT: str = "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s"
    LOG_LEVEL: str = "INFO"

    # ffmpeg
    # set USE_STATIC_FFMPEG=false in .env to manage ffmpeg yourself
    USE_STATIC_FFMPEG: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors(cls, v: object) -> object:
        """Allow CORS_ORIGINS to be set as a single comma-separated string."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()

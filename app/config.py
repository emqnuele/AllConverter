from __future__ import annotations
from pathlib import Path


class Settings:
    # directories
    BASE_DIR: Path = Path(__file__).resolve().parents[1]
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    CONVERTED_DIR: Path = BASE_DIR / "converted"
    FRONTEND_DIST: Path = BASE_DIR / "frontend" / "dist"

    # limits
    MAX_FILE_SIZE: int = 500 * 1024 * 1024   # 500 MB
    MAX_WORKERS: int = 4

    SESSION_TTL_HOURS: float = 6.0
    CLEANUP_INTERVAL_SECONDS: float = 3600.0

    # logging
    LOG_FORMAT: str = "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s"
    LOG_LEVEL: str = "INFO"

    # ffmpeg
    # to use static-ffmepg to auto download if not present, set to false to manage it on your own
    USE_STATIC_FFMPEG: bool = True


settings = Settings()

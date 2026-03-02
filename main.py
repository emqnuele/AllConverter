from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import (
    convert_router,
    download_router,
    formats_router,
)
from app.utils.cleanup import cleanup_loop

logging.basicConfig(level=settings.LOG_LEVEL, format=settings.LOG_FORMAT)
logger = logging.getLogger("allconverter")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

    cleanup_task = asyncio.create_task(
        cleanup_loop(
            settings.CONVERTED_DIR,
            settings.SESSION_TTL_HOURS,
            settings.CLEANUP_INTERVAL_SECONDS,
        )
    )
    logger.info("AllConverter API started ✓")

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("AllConverter API stopped")


def create_app() -> FastAPI:
    app = FastAPI(
        title="AllConverter API",
        description="Universal file conversion service — images, audio, video, documents.",
        version="3.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = "/api"
    app.include_router(formats_router, prefix=prefix, tags=["Formats"])
    app.include_router(convert_router, prefix=prefix, tags=["Convert"])
    app.include_router(download_router, prefix=prefix, tags=["Download"])

    _mount_frontend(app)
    return app


def _mount_frontend(app: FastAPI) -> None:
    dist = settings.FRONTEND_DIST
    if not dist.exists():
        logger.info("Frontend dist not found — skipping static file serving")
        return

    assets_dir = dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = dist / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        index = dist / "index.html"
        if index.exists():
            return HTMLResponse(index.read_text(encoding="utf-8"))
        from fastapi import HTTPException
        raise HTTPException(status_code=404)


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["uploads/*", "converted/*", "frontend/*"],
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

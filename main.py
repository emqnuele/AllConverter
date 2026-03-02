from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.ratelimit import limiter
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

    from app.converters._ffmpeg import warmup_ffmpeg
    await warmup_ffmpeg()

    cleanup_task = asyncio.create_task(
        cleanup_loop(
            converted_dir=settings.CONVERTED_DIR,
            upload_dir=settings.UPLOAD_DIR,
            ttl_hours=settings.SESSION_TTL_HOURS,
            interval_seconds=settings.CLEANUP_INTERVAL_SECONDS,
        )
    )
    if "*" in settings.CORS_ORIGINS:
        logger.warning(
            "SECURITY WARNING: CORS_ORIGINS contains '*' — all origins are allowed. "
            "Set CORS_ORIGINS to your actual domain(s) in .env for production."
        )

    logger.info("AllConverter API started ✓")

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

    # shut down the conversion thread-pool gracefully
    from app.routes.convert import _executor
    _executor.shutdown(wait=False)

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

    # Rate limiting (slowapi)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # ------------------------------------------------------------------ #
    #  Security: internal-only API protection                             #
    #  Every /api/ request must carry X-Requested-With: <value>          #
    #  (the frontend sends it automatically).  Requests originating from #
    #  localhost are always allowed (health-checks, same-machine scripts).#
    # ------------------------------------------------------------------ #
    @app.middleware("http")
    async def require_internal_header(request: Request, call_next):
        if settings.REQUIRE_INTERNAL_HEADER and request.url.path.startswith("/api/"):
            client_host = (request.client.host if request.client else "") or ""
            is_localhost = client_host in ("127.0.0.1", "::1", "localhost")
            sent_header = request.headers.get("X-Requested-With", "")
            if not is_localhost and sent_header != settings.INTERNAL_HEADER_VALUE:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Forbidden: API is for internal use only"},
                )
        return await call_next(request)

    # ------------------------------------------------------------------ #
    #  Security: HTTP response headers                                    #
    # ------------------------------------------------------------------ #
    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self'; "
            "object-src 'none'; "
            "frame-ancestors 'none';"
        )
        # Only add HSTS when the connection is already HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=False,          # credentials + wildcard is spec-invalid; use explicit origins if you need cookies
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Requested-With"],
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
        # Resolve the candidate path and ensure it stays within dist
        candidate = (dist / full_path).resolve()
        dist_resolved = dist.resolve()
        try:
            candidate.relative_to(dist_resolved)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid path")
        if candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        index = dist / "index.html"
        if index.exists():
            return HTMLResponse(index.read_text(encoding="utf-8"))
        raise HTTPException(status_code=404)


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["uploads/*", "converted/*", "frontend/*", ".venv/*"],
    )

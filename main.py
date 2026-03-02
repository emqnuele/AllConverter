"""
AllConverter — FastAPI Backend v2.0
Modern file conversion API with async processing
"""

import asyncio
import json
import logging
import shutil
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from converters.audio_converter import AudioConverter
from converters.converter_factory import ConverterFactory
from converters.document_converter import DocumentConverter
from converters.image_converter import ImageConverter
from converters.video_converter import VideoConverter
from utils.file_detection import FileTypeDetector

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(message)s",
)
logger = logging.getLogger("allconverter")

# ─── Config ─────────────────────────────────────────────────────────────────

UPLOAD_DIR = Path("uploads")
CONVERTED_DIR = Path("converted")
FRONTEND_DIST = Path("frontend/dist")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_WORKERS = 4

executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
detector = FileTypeDetector()
factory = ConverterFactory()


# ─── Lifecycle ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(exist_ok=True)
    CONVERTED_DIR.mkdir(exist_ok=True)
    logger.info("AllConverter API started ✓")
    yield
    executor.shutdown(wait=False)
    logger.info("AllConverter API stopped")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AllConverter API",
    description="Modern file conversion service",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _build_formats() -> Dict[str, Any]:
    img = ImageConverter()
    aud = AudioConverter()
    vid = VideoConverter()
    doc = DocumentConverter()
    return {
        "image": {
            "input": img.get_supported_input_formats(),
            "output": img.get_supported_output_formats(),
        },
        "audio": {
            "input": aud.get_supported_input_formats(),
            "output": aud.get_supported_output_formats(),
        },
        "video": {
            "input": vid.get_supported_input_formats(),
            "output": vid.get_supported_output_formats(),
        },
        "document": {
            "input": doc.get_supported_input_formats(),
            "output": doc.get_supported_output_formats(),
        },
    }


_formats_cache: Optional[Dict[str, Any]] = None


def _get_formats() -> Dict[str, Any]:
    global _formats_cache
    if _formats_cache is None:
        _formats_cache = _build_formats()
    return _formats_cache


def _process_file(
    input_path: str,
    output_path: str,
    target_format: str,
    options: Dict[str, Any],
) -> Dict[str, Any]:
    """Run a single conversion synchronously (called from thread pool)."""
    try:
        mime_type = detector.get_mime_type(input_path)
        source_ext = Path(input_path).suffix.lstrip(".").lower()
        converter = factory.get_converter(mime_type, source_ext, target_format)

        if converter is None:
            return {"success": False, "error": f"Unsupported file type: {mime_type}"}

        ok = converter.convert(input_path, output_path, **options)

        if ok and Path(output_path).exists():
            return {
                "success": True,
                "output_filename": Path(output_path).name,
                "size": Path(output_path).stat().st_size,
            }
        return {"success": False, "error": "Conversion produced no output"}

    except Exception as exc:
        logger.error("Conversion error: %s", exc)
        return {"success": False, "error": str(exc)}


def _safe_path(base: Path, *parts: str) -> Path:
    """Resolve a path and assert it stays inside base (prevent traversal)."""
    resolved = (base / Path(*parts)).resolve()
    if not str(resolved).startswith(str(base.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/api/formats")
async def get_formats():
    """All supported input/output formats, grouped by category."""
    return _get_formats()


@app.post("/api/convert")
async def convert_files(
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    options: str = Form(default="{}"),
):
    """
    Accept one or more files, convert each to *target_format*,
    and return a session with download links.
    """
    session_id = uuid.uuid4().hex
    session_dir = CONVERTED_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        opts: Dict[str, Any] = json.loads(options) if options else {}
    except json.JSONDecodeError:
        opts = {}

    saved: List[tuple[Path, str]] = []
    try:
        # ── Persist uploaded files ──────────────────────────────────────────
        for uf in files:
            dest = UPLOAD_DIR / f"{session_id}_{uf.filename}"
            content = await uf.read()
            async with aiofiles.open(dest, "wb") as fh:
                await fh.write(content)
            saved.append((dest, uf.filename or "file"))

        # ── Run conversions in thread pool ──────────────────────────────────
        loop = asyncio.get_event_loop()
        tasks = []
        for src_path, original_name in saved:
            stem = Path(original_name).stem
            out_name = f"{stem}.{target_format.lower()}"
            out_path = session_dir / out_name
            task = loop.run_in_executor(
                executor,
                _process_file,
                str(src_path),
                str(out_path),
                target_format,
                opts,
            )
            tasks.append((original_name, out_name, task))

        results = []
        for original_name, out_name, task in tasks:
            outcome = await task
            results.append({"original_name": original_name, "output_filename": out_name, **outcome})

        # ── Write session metadata ──────────────────────────────────────────
        metadata = {
            "session_id": session_id,
            "target_format": target_format,
            "results": results,
            "total": len(results),
            "successful": sum(1 for r in results if r["success"]),
        }
        async with aiofiles.open(session_dir / "session_info.json", "w") as fh:
            await fh.write(json.dumps(metadata, indent=2))

        return metadata

    except Exception as exc:
        shutil.rmtree(session_dir, ignore_errors=True)
        logger.error("Batch conversion failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        for src_path, _ in saved:
            src_path.unlink(missing_ok=True)


@app.get("/api/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """Download a single converted file."""
    file_path = _safe_path(CONVERTED_DIR, session_id, filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
    )


@app.get("/api/download-all/{session_id}")
async def download_all(session_id: str):
    """Stream all converted files as a ZIP archive."""
    session_dir = _safe_path(CONVERTED_DIR, session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in session_dir.iterdir():
            if fp.name != "session_info.json":
                zf.write(fp, fp.name)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="converted_{session_id[:8]}.zip"'
        },
    )


@app.delete("/api/session/{session_id}")
async def clear_session(session_id: str, background_tasks: BackgroundTasks):
    """Delete a session and all its files."""
    session_dir = _safe_path(CONVERTED_DIR, session_id)
    background_tasks.add_task(shutil.rmtree, str(session_dir), True)
    return {"message": "Session queued for deletion"}


@app.get("/api/history")
async def get_history():
    """Return metadata for all past sessions, newest first."""
    history = []
    if not CONVERTED_DIR.exists():
        return history
    for sd in sorted(CONVERTED_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        info = sd / "session_info.json"
        if info.exists():
            try:
                async with aiofiles.open(info) as fh:
                    history.append(json.loads(await fh.read()))
            except Exception:
                pass
    return history


# ─── Serve frontend in production ────────────────────────────────────────────
# Registered last so it never shadows /api/* routes.

if FRONTEND_DIST.exists():
    from fastapi.responses import HTMLResponse

    # Serve hashed assets (JS/CSS bundles) from /assets/<hash>.js etc.
    _assets_dir = FRONTEND_DIST / "assets"
    if _assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    # Catch-all: return index.html for client-side routing, or the exact file.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = FRONTEND_DIST / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return HTMLResponse(index.read_text())
        raise HTTPException(status_code=404)


# ─── Dev entry-point ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

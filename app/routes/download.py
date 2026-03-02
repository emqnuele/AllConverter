from __future__ import annotations
import hashlib
import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.config import settings

router = APIRouter()


def _safe_path(base: Path, *parts: str) -> Path:
    """Resolve path and ensure it stays strictly inside *base*."""
    resolved = (base / Path(*parts)).resolve()
    base_resolved = base.resolve()
    try:
        resolved.relative_to(base_resolved)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


def _verify_token(session_dir: Path, token: str) -> bool:
    info_file = session_dir / "session_info.json"
    if not info_file.exists():
        return False
    try:
        data = json.loads(info_file.read_text(encoding="utf-8"))
    except Exception:
        return False
    stored_hash: str | None = data.get("download_token")
    if not stored_hash:
        return True  # legacy session without token — allow
    if not token:
        return False
    return hashlib.sha256(token.encode()).hexdigest() == stored_hash


@router.get(
    "/download/{session_id}/{filename}",
    summary="Download a single converted file",
)
async def download_file(
    session_id: str,
    filename: str,
    token: str = Query(default="", description="Download token returned by /convert"),
) -> FileResponse:
    if filename == "session_info.json":
        raise HTTPException(status_code=403, detail="Access denied")
    session_dir = _safe_path(settings.CONVERTED_DIR, session_id)
    if not _verify_token(session_dir, token):
        raise HTTPException(status_code=403, detail="Invalid or missing download token")
    file_path = _safe_path(settings.CONVERTED_DIR, session_id, filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
    )


@router.get(
    "/download-all/{session_id}",
    summary="Download all converted files as a ZIP archive",
)
async def download_all(
    session_id: str,
    token: str = Query(default="", description="Download token returned by /convert"),
) -> FileResponse:
    session_dir = _safe_path(settings.CONVERTED_DIR, session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    if not _verify_token(session_dir, token):
        raise HTTPException(status_code=403, detail="Invalid or missing download token")

    # Write ZIP to a temp file on disk — avoids buffering GBs in RAM (VULN-09).
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".zip")
    os.close(tmp_fd)
    try:
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for fp in session_dir.iterdir():
                if fp.name != "session_info.json":
                    zf.write(fp, fp.name)
    except Exception:
        Path(tmp_path).unlink(missing_ok=True)
        raise

    return FileResponse(
        tmp_path,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="converted_{session_id[:8]}.zip"'
            )
        },
        background=BackgroundTask(os.unlink, tmp_path),
    )


@router.delete("/session/{session_id}", summary="Delete a conversion session")
async def clear_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    token: str = Query(default="", description="Download token returned by /convert"),
) -> dict:
    session_dir = _safe_path(settings.CONVERTED_DIR, session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    if not _verify_token(session_dir, token):
        raise HTTPException(status_code=403, detail="Invalid or missing download token")
    background_tasks.add_task(shutil.rmtree, str(session_dir), True)
    return {"message": "Session queued for deletion", "session_id": session_id}

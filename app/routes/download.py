from __future__ import annotations
import shutil
import zipfile
from io import BytesIO
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.config import settings

router = APIRouter()


def _safe_path(base: Path, *parts: str) -> Path:
    resolved = (base / Path(*parts)).resolve()
    if not str(resolved).startswith(str(base.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


@router.get(
    "/download/{session_id}/{filename}",
    summary="Download a single converted file",
)
async def download_file(session_id: str, filename: str) -> FileResponse:
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
async def download_all(session_id: str) -> StreamingResponse:
    session_dir = _safe_path(settings.CONVERTED_DIR, session_id)
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
            "Content-Disposition": (
                f'attachment; filename="converted_{session_id[:8]}.zip"'
            )
        },
    )


@router.delete("/session/{session_id}", summary="Delete a conversion session")
async def clear_session(
    session_id: str,
    background_tasks: BackgroundTasks,
) -> dict:
    session_dir = _safe_path(settings.CONVERTED_DIR, session_id)
    background_tasks.add_task(shutil.rmtree, str(session_dir), True)
    return {"message": "Session queued for deletion", "session_id": session_id}

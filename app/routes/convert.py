from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import secrets
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Tuple

import aiofiles
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.config import settings
from app.converters.factory import ConverterFactory, _EXT_CAT, _FACTORIES
from app.models import ConversionResult, ConversionSession
from app.ratelimit import limiter
from app.utils.detection import FileTypeDetector
from app.utils.options import normalize_options

_FORMAT_RE = re.compile(r"^[a-z0-9]+$")

router = APIRouter()
logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=settings.MAX_WORKERS)
_detector = FileTypeDetector()
_factory = ConverterFactory()

_CAT_OUTPUTS: dict[str, frozenset[str]] = {
    cat: frozenset(cls().get_supported_output_formats())
    for cat, cls in _FACTORIES.items()
}



def _process_file(
    input_path: str,
    output_path: str,
    target_format: str,
    options: Dict[str, Any],
) -> Dict[str, Any]:
    try:
        mime = _detector.get_mime_type(input_path)
        src_ext = _detector.get_ext(input_path)

        converter = _factory.get_converter(mime, src_ext, target_format)
        if converter is None:
            return {
                "success": False,
                "error": f"Unsupported source type: .{src_ext!r} (mime={mime})",
            }

        category = next(
            (cat for cat, cls in _FACTORIES.items() if isinstance(converter, cls)),
            "unknown",
        )
        norm_opts = normalize_options(category, options)

        ok = converter.convert(input_path, output_path, **norm_opts)

        if ok and Path(output_path).exists():
            return {
                "success": True,
                "output_filename": Path(output_path).name,
                "size": Path(output_path).stat().st_size,
            }
        return {"success": False, "error": "Conversion produced no output file"}

    except Exception:
        logger.exception("Unhandled error in conversion worker")
        return {"success": False, "error": "Conversion failed due to an internal error"}



@router.post(
    "/convert",
    response_model=ConversionSession,
    summary="Convert one or more files to a target format",
)
@limiter.limit("20/minute")
async def convert_files(
    request: Request,
    files: List[UploadFile] = File(..., description="Files to convert"),
    target_format: str = Form(..., description="Target format extension (e.g. 'mp4')"),
    options: str = Form(default="{}", description="JSON-encoded conversion options"),
) -> dict:
    target_format = target_format.strip().lower().lstrip(".")

    if not _FORMAT_RE.match(target_format):
        raise HTTPException(
            status_code=422,
            detail="Invalid target_format: only lowercase letters and digits are allowed.",
        )

    try:
        opts: Dict[str, Any] = json.loads(options) if options else {}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid options JSON: {exc}") from exc

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(files) > settings.MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files: max {settings.MAX_FILES_PER_REQUEST} per request.",
        )


    session_id = uuid.uuid4().hex
    session_dir = settings.CONVERTED_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    download_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(download_token.encode()).hexdigest()

    saved: List[Tuple[Path, str]] = []
    opened_paths: List[Path] = []

    try:
        for uf in files:
            filename = Path(uf.filename or "upload").name or "upload"
            dest = settings.UPLOAD_DIR / f"{session_id}_{filename}"
            opened_paths.append(dest)
            src_ext = Path(filename).suffix.lstrip(".").lower()
            src_cat = _EXT_CAT.get(src_ext)
            if src_cat and target_format not in _CAT_OUTPUTS.get(src_cat, frozenset()):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Cannot convert '{filename}' (.{src_ext}) "
                        f"to .{target_format}: unsupported conversion."
                    ),
                )

            received = 0
            try:
                async with aiofiles.open(dest, "wb") as fh:
                    while True:
                        chunk = await uf.read(65536)  # 64 KiB chunks
                        if not chunk:
                            break
                        received += len(chunk)
                        if received > settings.MAX_FILE_SIZE:
                            raise HTTPException(
                                status_code=413,
                                detail=(
                                    f"'{filename}' exceeds the "
                                    f"{settings.MAX_FILE_SIZE // (1024 ** 2)} MB limit"
                                ),
                            )
                        await fh.write(chunk)
            except HTTPException:
                dest.unlink(missing_ok=True)  # remove partial file
                raise

            saved.append((dest, filename))


        loop = asyncio.get_event_loop()
        tasks = []
        for src_path, original_name in saved:
            stem = Path(original_name).stem
            out_name = f"{stem}.{target_format}"
            out_path = session_dir / out_name
            task = loop.run_in_executor(
                _executor,
                _process_file,
                str(src_path),
                str(out_path),
                target_format,
                opts,
            )
            tasks.append((original_name, out_name, task))

        results: List[ConversionResult] = []
        for original_name, out_name, task in tasks:
            outcome = await task
            outcome.pop("output_filename", None)
            results.append(
                ConversionResult(
                    original_name=original_name,
                    output_filename=out_name,
                    **outcome,
                )
            )


        session = ConversionSession(
            session_id=session_id,
            target_format=target_format,
            results=results,
            total=len(results),
            successful=sum(1 for r in results if r.success),
            download_token=download_token,
        )

        storage = session.model_dump()
        storage["download_token"] = token_hash
        async with aiofiles.open(session_dir / "session_info.json", "w") as fh:
            await fh.write(json.dumps(storage, indent=2))
        return session.model_dump()

    except HTTPException:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise
    except Exception:
        shutil.rmtree(session_dir, ignore_errors=True)
        logger.exception("Batch conversion failed")
        raise HTTPException(status_code=500, detail="Internal conversion error") from None
    finally:
        for p in opened_paths:
            p.unlink(missing_ok=True)

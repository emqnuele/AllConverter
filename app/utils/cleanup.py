from __future__ import annotations
import asyncio
import logging
import shutil
import time
from pathlib import Path

logger = logging.getLogger(__name__)


async def cleanup_loop(
    converted_dir: Path,
    ttl_hours: float,
    interval_seconds: float,
) -> None:
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await _purge_old_sessions(converted_dir, ttl_hours)
        except asyncio.CancelledError:
            logger.info("Cleanup task cancelled")
            return
        except Exception:
            logger.exception("Cleanup task error (will retry)")


async def _purge_old_sessions(converted_dir: Path, ttl_hours: float) -> None:
    if not converted_dir.exists():
        return

    cutoff = time.time() - ttl_hours * 3600
    removed = 0

    for session_dir in converted_dir.iterdir():
        if not session_dir.is_dir():
            continue
        try:
            if session_dir.stat().st_mtime < cutoff:
                shutil.rmtree(session_dir, ignore_errors=True)
                removed += 1
        except Exception as exc:
            logger.warning("Could not remove %s: %s", session_dir, exc)

    if removed:
        logger.info("Cleanup: removed %d stale session(s)", removed)

from __future__ import annotations
import asyncio
import logging
import threading

logger = logging.getLogger(__name__)
_ffmpeg_lock = threading.Lock()
_ffmpeg_ready = False


def ensure_ffmpeg() -> None:
    global _ffmpeg_ready
    if _ffmpeg_ready:
        return
    with _ffmpeg_lock:
        if _ffmpeg_ready:
            return
        try:
            from app.config import settings
            if settings.USE_STATIC_FFMPEG:
                import static_ffmpeg
                logger.info("Bootstrapping static-ffmpeg (may download on first run)...")
                static_ffmpeg.add_paths()
                logger.info("static-ffmpeg ready.")
        except Exception as exc:
            logger.warning("static-ffmpeg bootstrap skipped: %s", exc)
        _ffmpeg_ready = True


async def warmup_ffmpeg() -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, ensure_ffmpeg)


AUDIO_CODEC: dict[str, str] = {
    "mp3":  "libmp3lame",
    "ogg":  "libvorbis",
    "opus": "libopus",
    "flac": "flac",
    "aac":  "aac",
    "m4a":  "aac",
    "wav":  "pcm_s16le",
    "wma":  "wmav2",
    "ac3":  "ac3",
    "amr":  "libopencore_amrnb",
}

VIDEO_CODEC: dict[str, str] = {
    "mp4":  "libx264",
    "mov":  "libx264",
    "mkv":  "libx264",
    "flv":  "libx264",
    "avi":  "libxvid",
    "webm": "libvpx-vp9",
    "ogv":  "libtheora",
    "3gp":  "h263",
}

PRESET_CODECS: frozenset[str] = frozenset({"libx264", "libx265"})

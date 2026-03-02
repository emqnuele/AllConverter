from __future__ import annotations
import logging
import re
from typing import Any, Dict

logger = logging.getLogger(__name__)

_BITRATE_RE = re.compile(r"^\d{1,7}[kKmM]?$")          # e.g. 192k, 5M, 320000
_RESOLUTION_RE = re.compile(r"^\d{1,5}x\d{1,5}$")       # e.g. 1920x1080
_FONT_SAFE_RE = re.compile(r"^[A-Za-z0-9 ,_'.-]{1,80}$")  # conservative font names

_ALLOWED_VIDEO_CODECS: frozenset[str] = frozenset({
    "libx264", "libx265", "libvpx", "libvpx-vp9", "libxvid",
    "libtheora", "h263", "copy",
})
_ALLOWED_PRESETS: frozenset[str] = frozenset({
    "ultrafast", "superfast", "veryfast", "faster", "fast",
    "medium", "slow", "slower", "veryslow",
})
_ALLOWED_PAPER_SIZES: frozenset[str] = frozenset({
    "a4", "a3", "a5", "letter", "legal", "executive",
})
_ALLOWED_IMAGE_FILTERS: frozenset[str] = frozenset({
    "blur", "sharpen", "contour", "detail", "edge_enhance", "emboss", "grayscale",
})
_ALLOWED_FLIP_VALUES: frozenset[str] = frozenset({"horizontal", "vertical"})
_ALLOWED_AUDIO_CHANNELS: frozenset[int] = frozenset({1, 2, 6, 8})
_ALLOWED_SAMPLE_RATES: frozenset[int] = frozenset({
    8000, 11025, 16000, 22050, 32000, 44100, 48000, 88200, 96000,
})


def _check_bitrate(val: Any) -> str | None:
    """Return the validated bitrate string or None if invalid."""
    s = str(val).strip()
    if _BITRATE_RE.match(s):
        return s
    logger.warning("Rejected invalid bitrate value: %r", val)
    return None


def normalize_options(category: str, raw: Dict[str, Any]) -> Dict[str, Any]:
    if not raw:
        return {}

    handlers = {
        "audio":    _normalize_audio,
        "video":    _normalize_video,
        "document": _normalize_document,
        "image":    _normalize_image,
    }
    handler = handlers.get(category)
    return handler(raw) if handler else {}  # unknown category → drop all opts


def _normalize_image(raw: dict) -> dict:
    opts: dict = {}

    if "quality" in raw and raw["quality"] is not None:
        q = int(raw["quality"])
        opts["quality"] = max(1, min(100, q))

    if raw.get("rotate") is not None:
        r = int(raw["rotate"])
        if r in (0, 90, 180, 270):
            opts["rotate"] = r

    if raw.get("flip") in _ALLOWED_FLIP_VALUES:
        opts["flip"] = raw["flip"]

    if raw.get("filter") in _ALLOWED_IMAGE_FILTERS:
        opts["filter"] = raw["filter"]

    if raw.get("dpi") is not None:
        dpi = int(raw["dpi"])
        if 1 <= dpi <= 1200:
            opts["dpi"] = dpi

    # resize: accept (w, h) tuple or a float scale factor 0<s<=1
    resize = raw.get("resize")
    if resize is not None:
        if isinstance(resize, (list, tuple)) and len(resize) == 2:
            w, h = int(resize[0]), int(resize[1])
            if 1 <= w <= 16000 and 1 <= h <= 16000:
                opts["resize"] = (w, h)
        elif isinstance(resize, (int, float)) and 0 < float(resize) <= 1:
            opts["resize"] = float(resize)

    return opts


def _normalize_audio(raw: dict) -> dict:
    opts: dict = {}

    bitrate = raw.get("bitrate")
    if bitrate is not None:
        validated = _check_bitrate(bitrate)
        if validated:
            opts["bitrate"] = validated

    if raw.get("sample_rate") is not None:
        sr = int(raw["sample_rate"])
        if sr in _ALLOWED_SAMPLE_RATES:
            opts["sample_rate"] = sr

    if raw.get("channels") is not None:
        ch = int(raw["channels"])
        if ch in _ALLOWED_AUDIO_CHANNELS:
            opts["channels"] = ch

    if raw.get("normalize"):
        opts["normalize"] = True

    if raw.get("volume_db") is not None:
        vol = float(raw["volume_db"])
        if -30.0 <= vol <= 30.0:
            opts["volume_change"] = vol

    if raw.get("start_ms") is not None:
        t = float(raw["start_ms"])
        if t >= 0:
            opts["trim_start"] = t / 1000.0
    if raw.get("end_ms") is not None:
        t = float(raw["end_ms"])
        if t >= 0:
            opts["trim_end"] = t / 1000.0

    return opts


def _normalize_video(raw: dict) -> dict:
    opts: dict = {}

    for key in ("video_bitrate", "audio_bitrate"):
        if raw.get(key) is not None:
            validated = _check_bitrate(raw[key])
            if validated:
                opts[key] = validated

    if raw.get("resolution") is not None:
        res = str(raw["resolution"]).strip()
        if _RESOLUTION_RE.match(res):
            opts["resolution"] = res
        else:
            logger.warning("Rejected invalid resolution: %r", raw["resolution"])

    if raw.get("fps") is not None:
        fps = int(raw["fps"])
        if 1 <= fps <= 120:
            opts["fps"] = fps

    if raw.get("codec") is not None:
        codec = str(raw["codec"]).strip().lower()
        if codec in _ALLOWED_VIDEO_CODECS:
            opts["codec"] = codec
        else:
            logger.warning("Rejected unknown video codec: %r", raw["codec"])

    if raw.get("preset") is not None:
        preset = str(raw["preset"]).strip().lower()
        if preset in _ALLOWED_PRESETS:
            opts["preset"] = preset
        else:
            logger.warning("Rejected unknown preset: %r", raw["preset"])

    if raw.get("extract_audio"):
        opts["extract_audio"] = True

    if raw.get("rotation") is not None:
        r = int(raw["rotation"])
        if r in (90, 180, 270):
            opts["rotate"] = r

    if raw.get("mute") is not None:
        opts["no_audio"] = bool(raw["mute"])

    if raw.get("start_sec") is not None:
        t = float(raw["start_sec"])
        if t >= 0:
            opts["trim_start"] = t
    if raw.get("end_sec") is not None:
        t = float(raw["end_sec"])
        if t >= 0:
            opts["trim_end"] = t

    return opts


def _normalize_document(raw: dict) -> dict:
    opts: dict = {}

    if raw.get("paper_size") is not None:
        ps = str(raw["paper_size"]).strip().lower()
        if ps in _ALLOWED_PAPER_SIZES:
            opts["paper_size"] = ps

    if raw.get("font_name") is not None:
        font = str(raw["font_name"]).strip()
        if _FONT_SAFE_RE.match(font):
            opts["font"] = font
        else:
            logger.warning("Rejected unsafe font name: %r", raw["font_name"])

    if raw.get("font_size") is not None:
        fs = int(raw["font_size"])
        if 6 <= fs <= 72:
            opts["font_size"] = fs

    if raw.get("include_toc") is not None:
        opts["toc"] = bool(raw["include_toc"])
    elif raw.get("toc") is not None:
        opts["toc"] = bool(raw["toc"])

    if raw.get("encrypt_pdf") is not None:
        opts["encrypted_pdf"] = bool(raw["encrypt_pdf"])

    if raw.get("pdf_password") is not None:
        pw = str(raw["pdf_password"])
        if len(pw) <= 128:          # basic sanity length check
            opts["password"] = pw

    margin_keys = ("top", "right", "bottom", "left")
    margins = {}
    for side in margin_keys:
        v = raw.get(f"margin_{side}")
        if v is not None:
            m = int(v)
            if 0 <= m <= 100:
                margins[side] = m
    if margins:
        opts["margins"] = margins

    return opts

from __future__ import annotations
from typing import Any, Dict


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
    return handler(raw) if handler else dict(raw)


def _normalize_image(raw: dict) -> dict:
    opts = dict(raw)
    if "quality" in opts:
        opts["quality"] = int(opts["quality"])
    if "rotate" in opts and opts["rotate"]:
        opts["rotate"] = int(opts["rotate"])
    return opts


def _normalize_audio(raw: dict) -> dict:
    opts: dict = {}

    for key in ("bitrate", "sample_rate", "channels", "normalize"):
        if key in raw and raw[key] is not None:
            opts[key] = raw[key]

    if raw.get("volume_db") is not None:
        opts["volume_change"] = float(raw["volume_db"])

    if raw.get("start_ms") is not None:
        opts["trim_start"] = float(raw["start_ms"]) / 1000.0
    if raw.get("end_ms") is not None:
        opts["trim_end"] = float(raw["end_ms"]) / 1000.0

    return opts


def _normalize_video(raw: dict) -> dict:
    opts: dict = {}

    for key in ("video_bitrate", "audio_bitrate", "resolution",
                "fps", "codec", "preset", "extract_audio"):
        if key in raw and raw[key] is not None:
            opts[key] = raw[key]

    if raw.get("rotation") is not None:
        opts["rotate"] = int(raw["rotation"])

    if raw.get("mute") is not None:
        opts["no_audio"] = bool(raw["mute"])

    if raw.get("start_sec") is not None:
        opts["trim_start"] = float(raw["start_sec"])
    if raw.get("end_sec") is not None:
        opts["trim_end"] = float(raw["end_sec"])

    return opts


def _normalize_document(raw: dict) -> dict:
    opts: dict = {}

    for key in ("paper_size", "toc", "template", "password"):
        if key in raw and raw[key] is not None:
            opts[key] = raw[key]

    if raw.get("font_name") is not None:
        opts["font"] = raw["font_name"]

    if raw.get("font_size") is not None:
        opts["font_size"] = int(raw["font_size"])

    if raw.get("include_toc") is not None:
        opts["toc"] = bool(raw["include_toc"])

    if raw.get("encrypt_pdf") is not None:
        opts["encrypted_pdf"] = bool(raw["encrypt_pdf"])

    if raw.get("pdf_password") is not None:
        opts["password"] = raw["pdf_password"]

    margin_keys = ("top", "right", "bottom", "left")
    margins = {
        side: int(raw[f"margin_{side}"])
        for side in margin_keys
        if raw.get(f"margin_{side}") is not None
    }
    if margins:
        opts["margins"] = margins

    return opts

from __future__ import annotations
import logging
import mimetypes
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_EXT_TO_MIME: dict[str, str] = {
    # Images
    "jpg":   "image/jpeg",
    "jpeg":  "image/jpeg",
    "png":   "image/png",
    "gif":   "image/gif",
    "bmp":   "image/bmp",
    "tiff":  "image/tiff",
    "tif":   "image/tiff",
    "webp":  "image/webp",
    "heic":  "image/heic",
    "heif":  "image/heif",
    "ico":   "image/x-icon",
    "avif":  "image/avif",
    "ppm":   "image/x-portable-pixmap",
    "pgm":   "image/x-portable-graymap",
    "pbm":   "image/x-portable-bitmap",
    "pnm":   "image/x-portable-anymap",
    "svg":   "image/svg+xml",
    # Audio
    "mp3":   "audio/mpeg",
    "wav":   "audio/wav",
    "ogg":   "audio/ogg",
    "flac":  "audio/flac",
    "aac":   "audio/aac",
    "m4a":   "audio/mp4",
    "wma":   "audio/x-ms-wma",
    "aiff":  "audio/aiff",
    "alac":  "audio/mp4",
    "opus":  "audio/opus",
    "ac3":   "audio/ac3",
    "amr":   "audio/amr",
    # Video
    "mp4":   "video/mp4",
    "avi":   "video/x-msvideo",
    "mov":   "video/quicktime",
    "wmv":   "video/x-ms-wmv",
    "flv":   "video/x-flv",
    "mkv":   "video/x-matroska",
    "webm":  "video/webm",
    "m4v":   "video/x-m4v",
    "mpeg":  "video/mpeg",
    "mpg":   "video/mpeg",
    "3gp":   "video/3gpp",
    "vob":   "video/dvd",
    "ogv":   "video/ogg",
    "mts":   "video/mp2t",
    "m2ts":  "video/mp2t",
    # Documents
    "pdf":   "application/pdf",
    "doc":   "application/msword",
    "docx":  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "odt":   "application/vnd.oasis.opendocument.text",
    "ods":   "application/vnd.oasis.opendocument.spreadsheet",
    "odp":   "application/vnd.oasis.opendocument.presentation",
    "xls":   "application/vnd.ms-excel",
    "xlsx":  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt":   "application/vnd.ms-powerpoint",
    "pptx":  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "txt":   "text/plain",
    "rtf":   "application/rtf",
    "html":  "text/html",
    "htm":   "text/html",
    "md":    "text/markdown",
    "markdown": "text/markdown",
    "csv":   "text/csv",
    "json":  "application/json",
    "xml":   "application/xml",
    "epub":  "application/epub+zip",
    "tex":   "application/x-tex",
    "org":   "text/plain",
    "rst":   "text/plain",
    "adoc":  "text/plain",
}

try:
    import magic as _magic
    _MAGIC_AVAILABLE = True
except ImportError:
    _MAGIC_AVAILABLE = False


class FileTypeDetector:

    @staticmethod
    def get_mime_type(file_path: str) -> str:
        ext = Path(file_path).suffix.lstrip(".").lower()

        if ext in _EXT_TO_MIME:
            return _EXT_TO_MIME[ext]

        if _MAGIC_AVAILABLE:
            try:
                mime = _magic.from_file(file_path, mime=True)
                if mime and mime != "application/octet-stream":
                    return mime
            except Exception as exc:
                logger.debug("python-magic failed for %s: %s", file_path, exc)

        guessed, _ = mimetypes.guess_type(file_path)
        if guessed:
            return guessed

        return "application/octet-stream"

    @staticmethod
    def get_ext(file_path: str) -> str:
        return Path(file_path).suffix.lstrip(".").lower()

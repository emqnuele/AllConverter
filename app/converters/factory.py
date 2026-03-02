from __future__ import annotations
import logging
from typing import Optional
from .audio import AudioConverter
from .base import BaseConverter
from .document import DocumentConverter
from .image import ImageConverter
from .video import VideoConverter

logger = logging.getLogger(__name__)

_EXT_CAT: dict[str, str] = {
    # images
    **dict.fromkeys(
        ["jpg","jpeg","png","gif","bmp","tiff","tif","webp","heic","heif","ico","ppm","pgm","pbm","pnm","avif"],
        "image",
    ),
    # audio
    **dict.fromkeys(
        ["mp3","wav","ogg","flac","aac","m4a","wma","aiff","alac","opus","ac3","amr"],
        "audio",
    ),
    # video
    **dict.fromkeys(
        ["mp4","avi","mov","wmv","flv","mkv","webm","m4v","mpeg","mpg","3gp","vob","ogv","mts","m2ts"],
        "video",
    ),
    # documents
    **dict.fromkeys(
        ["pdf","doc","docx","odt","ods","odp","txt","rtf","html","htm","md","markdown",
         "csv","json","xml","xls","xlsx","pptx","ppt","epub","tex","org","rst","adoc"],
        "document",
    ),
}

_MIME_PREFIX: dict[str, str] = {
    "image/":   "image",
    "audio/":   "audio",
    "video/":   "video",
    "text/":    "document",
}

_MIME_FULL: dict[str, str] = {
    "application/pdf":                                                      "document",
    "application/json":                                                     "document",
    "application/xml":                                                      "document",
    "application/msword":                                                   "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       "document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":"document",
    "application/vnd.ms-excel":                                             "document",
    "application/vnd.ms-powerpoint":                                        "document",
    "application/vnd.oasis.opendocument.text":                              "document",
    "application/vnd.oasis.opendocument.spreadsheet":                       "document",
    "application/vnd.oasis.opendocument.presentation":                      "document",
    "application/rtf":                                                      "document",
    "application/epub+zip":                                                 "document",
}

_FACTORIES: dict[str, type[BaseConverter]] = {
    "image":    ImageConverter,
    "audio":    AudioConverter,
    "video":    VideoConverter,
    "document": DocumentConverter,
}


class ConverterFactory:

    @staticmethod
    def get_converter(
        mime_type: str,
        src_ext: str = "",
        target_format: str = "",
    ) -> Optional[BaseConverter]:
        category = ConverterFactory._resolve_category(mime_type, src_ext)
        if category is None:
            logger.warning(
                "Cannot determine category for mime=%s ext=%s", mime_type, src_ext
            )
            return None

        cls = _FACTORIES.get(category)
        if cls is None:
            return None

        logger.debug("Resolved %s/%s → %s", mime_type, src_ext, cls.__name__)
        return cls()

    @staticmethod
    def _resolve_category(mime_type: str, src_ext: str) -> Optional[str]:
        m = (mime_type or "").lower().strip()

        if m in _MIME_FULL:
            return _MIME_FULL[m]

        for prefix, cat in _MIME_PREFIX.items():
            if m.startswith(prefix):
                return cat

        ext = (src_ext or "").lower().lstrip(".")
        if ext in _EXT_CAT:
            return _EXT_CAT[ext]

        return None

    @staticmethod
    def get_format_map() -> dict:
        return {
            cat: {
                "input":  cls().get_supported_input_formats(),
                "output": cls().get_supported_output_formats(),
            }
            for cat, cls in _FACTORIES.items()
        }

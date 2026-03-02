from __future__ import annotations
import io
import logging
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union
from PIL import Image, ImageFilter, ImageOps

_LANCZOS: Image.Resampling = getattr(Image, "Resampling", Image).LANCZOS  # type: ignore[attr-defined]

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

try:
    import fitz as _fitz
    _PYMUPDF: bool = True
except Exception:
    _PYMUPDF = False

try:
    import cairosvg as _cairosvg
    _CAIROSVG: bool = True
except Exception:
    _CAIROSVG = False

try:
    from svglib.svglib import svg2rlg as _svg2rlg          # type: ignore[import]
    from reportlab.graphics import renderPM as _renderPM   # type: ignore[import]
    _SVGLIB: bool = True
except Exception:
    _SVGLIB = False

from .base import BaseConverter

logger = logging.getLogger(__name__)

_NO_ALPHA = {"jpeg", "jpg", "bmp", "ppm", "pgm", "pbm", "pnm", "ico", "gif"}
_PIL_FORMAT = {
    "jpg": "JPEG",
    "jpeg": "JPEG",
    "tif": "TIFF",
    "pnm": "PPM",
}


class ImageConverter(BaseConverter):

    def get_supported_input_formats(self) -> List[str]:
        base = [
            "jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp",
            "heic", "heif", "ico", "ppm", "pgm", "pbm", "pnm", "avif",
        ]
        if _PYMUPDF or _CAIROSVG or _SVGLIB:
            base.append("svg")
        return base

    def get_supported_output_formats(self) -> List[str]:
        return [
            "jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp",
            "ico", "pdf", "ppm", "pgm", "pbm", "pnm", "avif",
        ]

    @staticmethod
    def _rasterize_svg(input_path: str) -> Image.Image:
        if _PYMUPDF:
            doc = _fitz.open(input_path)
            page = doc[0]
            mat = _fitz.Matrix(3, 3)
            pix = page.get_pixmap(matrix=mat, alpha=True)
            return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
        if _CAIROSVG:
            png_bytes = _cairosvg.svg2png(url=input_path)
            if png_bytes is None:
                raise ValueError(f"cairosvg returned no data for: {input_path}")
            return Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        if _SVGLIB:
            drawing = _svg2rlg(input_path)
            if drawing is None:
                raise ValueError(f"svglib could not parse SVG: {input_path}")
            buf = io.BytesIO()
            _renderPM.drawToFile(drawing, buf, fmt="PNG")
            buf.seek(0)
            return Image.open(buf).convert("RGBA")
        raise RuntimeError(
            "No SVG rasterizer available. Install pymupdf, cairosvg, or svglib."
        )

    def convert(self, input_path: str, output_path: str, **options: Any) -> bool:
        try:
            src_ext = self.src_ext(input_path)
            if src_ext == "svg":
                img = self._rasterize_svg(input_path)
            else:
                img = Image.open(input_path)
            img = ImageOps.exif_transpose(img)

            img = self._apply_transforms(img, options)
            img = self._normalise_mode(img, self.dst_ext(output_path))
            self._save(img, output_path, options)
            return True

        except Exception:
            logger.exception("Image conversion failed: %s → %s", input_path, output_path)
            return False

    def _apply_transforms(self, img: Image.Image, opts: dict) -> Image.Image:
        resize: Optional[Union[Tuple[int, int], float]] = opts.get("resize")
        rotate: Optional[int] = opts.get("rotate")
        flip: Optional[str] = opts.get("flip")
        filter_name: Optional[str] = opts.get("filter")

        if resize is not None:
            img = self._resize(img, resize)

        if rotate:
            img = img.rotate(-rotate, expand=True)

        if flip == "horizontal":
            img = ImageOps.mirror(img)
        elif flip == "vertical":
            img = ImageOps.flip(img)

        if filter_name:
            img = self._apply_filter(img, filter_name)

        return img

    @staticmethod
    def _resize(
        img: Image.Image, resize: Union[Tuple[int, int], float]
    ) -> Image.Image:
        if isinstance(resize, (int, float)) and 0 < resize <= 1:
            w = max(1, int(img.width * resize))
            h = max(1, int(img.height * resize))
            return img.resize((w, h), _LANCZOS)
        if isinstance(resize, (list, tuple)) and len(resize) == 2:
            w, h = int(resize[0]) or img.width, int(resize[1]) or img.height
            return img.resize((w, h), _LANCZOS)
        return img

    @staticmethod
    def _apply_filter(img: Image.Image, name: str) -> Image.Image:
        _MAP = {
            "blur": ImageFilter.BLUR,
            "sharpen": ImageFilter.SHARPEN,
            "contour": ImageFilter.CONTOUR,
            "detail": ImageFilter.DETAIL,
            "edge_enhance": ImageFilter.EDGE_ENHANCE,
            "emboss": ImageFilter.EMBOSS,
        }
        if name == "grayscale":
            return ImageOps.grayscale(img).convert("RGB")
        flt = _MAP.get(name)
        return img.filter(flt) if flt else img

    @staticmethod
    def _normalise_mode(img: Image.Image, ext: str) -> Image.Image:
        fmt = ext.lower()

        if fmt in _NO_ALPHA:
            if img.mode in ("RGBA", "LA", "PA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                alpha = img.split()[-1]
                if img.mode == "PA":
                    img = img.convert("RGBA")
                    alpha = img.split()[-1]
                bg.paste(img.convert("RGB"), mask=alpha)
                return bg
            if img.mode == "P":
                return img.convert("RGB")
            if img.mode not in ("RGB", "L"):
                return img.convert("RGB")
            return img

        if fmt == "pdf":
            if img.mode not in ("RGB", "RGBA", "L"):
                return img.convert("RGB")
            return img

        if img.mode == "P":
            return img.convert("RGBA")
        return img

    def _save(self, img: Image.Image, output_path: str, opts: dict) -> None:
        ext = self.dst_ext(output_path)
        pil_fmt = _PIL_FORMAT.get(ext, ext.upper())
        quality: int = int(opts.get("quality", 95))
        dpi: Optional[int] = opts.get("dpi")
        save_kw: dict = {}

        if pil_fmt in ("JPEG", "WEBP"):
            save_kw["quality"] = quality
            save_kw["optimize"] = True
        elif pil_fmt == "PNG":
            compress = max(0, min(9, int(9 - (quality / 100.0 * 9))))
            save_kw["compress_level"] = compress
            save_kw["optimize"] = True
        elif pil_fmt == "TIFF":
            save_kw["compression"] = "tiff_deflate"
        elif pil_fmt == "GIF":
            save_kw["optimize"] = True
        elif pil_fmt == "ICO":
            if img.width > 256 or img.height > 256:
                img = img.copy()
                img.thumbnail((256, 256), _LANCZOS)

        if dpi:
            save_kw["dpi"] = (dpi, dpi)

        img.save(output_path, format=pil_fmt, **save_kw)

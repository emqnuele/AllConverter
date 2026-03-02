from __future__ import annotations
import logging
import subprocess
from pathlib import Path
from typing import Any, List, Optional
from .base import BaseConverter
from ._ffmpeg import AUDIO_CODEC as _AUDIO_CODEC, ensure_ffmpeg as _ensure_ffmpeg

logger = logging.getLogger(__name__)


class AudioConverter(BaseConverter):

    def get_supported_input_formats(self) -> List[str]:
        return [
            "mp3", "wav", "ogg", "flac", "aac", "m4a", "wma",
            "aiff", "alac", "opus", "ac3", "amr",
        ]

    def get_supported_output_formats(self) -> List[str]:
        return ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"]

    def convert(self, input_path: str, output_path: str, **options: Any) -> bool:
        _ensure_ffmpeg()
        try:
            ext = self.dst_ext(output_path)
            cmd = self._build_cmd(input_path, output_path, ext, options)
            result = subprocess.run(
                cmd,
                capture_output=True, text=True,
                timeout=600,
            )
            if result.returncode != 0:
                logger.error("FFmpeg audio error:\n%s", result.stderr[-2000:])
                return False
            return Path(output_path).exists()
        except Exception:
            logger.exception("Audio conversion failed: %s → %s", input_path, output_path)
            return False

    def _build_cmd(
        self, input_path: str, output_path: str, ext: str, opts: dict
    ) -> list:
        bitrate: Optional[str]  = opts.get("bitrate")
        sample_rate: Optional[int] = opts.get("sample_rate")
        channels: Optional[int] = opts.get("channels")
        volume_change: Optional[float] = opts.get("volume_change")
        normalize: bool = opts.get("normalize", False)
        trim_start: Optional[float] = opts.get("trim_start")
        trim_end:   Optional[float] = opts.get("trim_end")

        cmd: list = ["ffmpeg", "-y"]

        if trim_start is not None:
            cmd += ["-ss", str(trim_start)]
        if trim_end is not None:
            cmd += ["-to", str(trim_end)]

        cmd += ["-i", input_path]

        cmd += ["-vn"]

        codec = _AUDIO_CODEC.get(ext)
        if codec:
            cmd += ["-c:a", codec]

        if bitrate and ext not in ("flac", "wav", "alac"):
            cmd += ["-b:a", bitrate]

        if sample_rate:
            cmd += ["-ar", str(sample_rate)]
        if channels:
            cmd += ["-ac", str(channels)]

        af: list[str] = []
        if volume_change:
            af.append(f"volume={volume_change}dB")
        if normalize:
            af.append("loudnorm")
        if af:
            cmd += ["-af", ",".join(af)]

        cmd.append(output_path)
        return cmd

from __future__ import annotations
import logging
import os
import subprocess
from pathlib import Path
from typing import Any, List, Optional
from .base import BaseConverter
from ._ffmpeg import AUDIO_CODEC as _AUDIO_CODEC, VIDEO_CODEC, PRESET_CODECS, ensure_ffmpeg as _ensure_ffmpeg

logger = logging.getLogger(__name__)

_CONTAINER_AUDIO: dict[str, str] = {
    "mp4":  "aac",
    "mov":  "aac",
    "mkv":  "aac",
    "flv":  "aac",
    "avi":  "libmp3lame",
    "webm": "libvorbis",
    "ogv":  "libvorbis",
    "3gp":  "libopencore_amrnb",
    **_AUDIO_CODEC,
}

_VIDEO_CODEC = VIDEO_CODEC
_PRESET_CODECS = PRESET_CODECS


class VideoConverter(BaseConverter):

    def get_supported_input_formats(self) -> List[str]:
        return [
            "mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "m4v",
            "mpeg", "mpg", "3gp", "vob", "ogv", "mts", "m2ts",
        ]

    def get_supported_output_formats(self) -> List[str]:
        return [
            "mp4", "avi", "mov", "mkv", "webm", "flv",
            "gif",
            "mp3", "ogg", "aac", "flac", "wav",
        ]

    def convert(self, input_path: str, output_path: str, **options: Any) -> bool:
        _ensure_ffmpeg()
        try:
            ext = self.dst_ext(output_path)
            if ext == "gif":
                return self._convert_to_gif(input_path, output_path, options)
            return self._convert_standard(input_path, output_path, ext, options)
        except Exception:
            logger.exception("Video conversion failed: %s → %s", input_path, output_path)
            return False

    def _convert_standard(
        self, input_path: str, output_path: str, ext: str, opts: dict
    ) -> bool:
        video_bitrate: Optional[str] = opts.get("video_bitrate")
        audio_bitrate: Optional[str] = opts.get("audio_bitrate")
        resolution:    Optional[str] = opts.get("resolution")
        fps:           Optional[int] = opts.get("fps")
        no_audio:      bool          = opts.get("no_audio", False)
        rotate:        Optional[int] = opts.get("rotate")
        codec:         Optional[str] = opts.get("codec")
        preset:        Optional[str] = opts.get("preset")
        trim_start:    Optional[float] = opts.get("trim_start")
        trim_end:      Optional[float] = opts.get("trim_end")

        is_audio_only = ext in _AUDIO_CODEC and ext not in _VIDEO_CODEC

        cmd: list = ["ffmpeg", "-y"]

        if trim_start is not None:
            cmd += ["-ss", str(trim_start)]
        if trim_end is not None:
            cmd += ["-to", str(trim_end)]

        cmd += ["-i", input_path]

        if is_audio_only:
            cmd += ["-vn"]
            ac = _AUDIO_CODEC.get(ext)
            if ac:
                cmd += ["-c:a", ac]
            if audio_bitrate:
                cmd += ["-b:a", audio_bitrate]
            cmd.append(output_path)
        else:
            effective_codec = codec or _VIDEO_CODEC.get(ext, "libx264")

            vf_parts: list[str] = []
            if resolution:
                vf_parts.append(f"scale={resolution.replace('x', ':')}")
            if rotate:
                _rot = {
                    90:  "transpose=1",
                    180: "transpose=1,transpose=1",
                    270: "transpose=2",
                }
                vf_rot = _rot.get(rotate)
                if vf_rot:
                    vf_parts.append(vf_rot)
            if vf_parts:
                cmd += ["-vf", ",".join(vf_parts)]

            if fps:
                cmd += ["-r", str(fps)]

            cmd += ["-c:v", effective_codec]

            if video_bitrate:
                cmd += ["-b:v", video_bitrate]

            if effective_codec in _PRESET_CODECS:
                cmd += ["-preset", preset or "medium"]

            if ext == "mp4":
                cmd += ["-movflags", "+faststart"]

            if no_audio:
                cmd += ["-an"]
            else:
                ac = _CONTAINER_AUDIO.get(ext)
                if ac:
                    cmd += ["-c:a", ac]
                if audio_bitrate:
                    cmd += ["-b:a", audio_bitrate]

            cmd.append(output_path)

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        if result.returncode != 0:
            logger.error("FFmpeg video error:\n%s", result.stderr[-3000:])
            return False
        return Path(output_path).exists()

    def _convert_to_gif(
        self, input_path: str, output_path: str, opts: dict
    ) -> bool:
        resolution: Optional[str] = opts.get("resolution")
        fps: int = opts.get("fps") or 12
        trim_start: Optional[float] = opts.get("trim_start")
        trim_end:   Optional[float] = opts.get("trim_end")

        _scale = f"scale={resolution.replace('x',':')}:flags=lanczos" if resolution else "scale=480:-1:flags=lanczos"
        vf_base = f"fps={fps},{_scale}"
        palette_path = output_path + ".palette.png"

        def _seek_args() -> list:
            a: list = []
            if trim_start is not None:
                a += ["-ss", str(trim_start)]
            if trim_end is not None:
                a += ["-to", str(trim_end)]
            return a

        try:
            p1 = ["ffmpeg", "-y"] + _seek_args() + ["-i", input_path,
                  "-vf", f"{vf_base},palettegen=stats_mode=diff",
                  palette_path]
            subprocess.run(p1, capture_output=True, timeout=600)
            if not Path(palette_path).exists():
                return False

            p2 = ["ffmpeg", "-y"] + _seek_args() + [
                "-i", input_path, "-i", palette_path,
                "-lavfi", f"{vf_base}[x];[x][1:v]paletteuse=dither=bayer",
                output_path,
            ]
            result = subprocess.run(p2, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                logger.error("FFmpeg GIF error:\n%s", result.stderr[-2000:])
                return False
            return Path(output_path).exists()
        finally:
            if Path(palette_path).exists():
                os.remove(palette_path)

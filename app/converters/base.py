from __future__ import annotations
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List


logger = logging.getLogger(__name__)


class BaseConverter(ABC):

    @abstractmethod
    def get_supported_input_formats(self) -> List[str]:
        pass

    @abstractmethod
    def get_supported_output_formats(self) -> List[str]:
        pass

    @abstractmethod
    def convert(self, input_path: str, output_path: str, **options: Any) -> bool:
        pass

    def is_conversion_supported(self, src_ext: str, dst_ext: str) -> bool:
        return (
            src_ext.lower() in self.get_supported_input_formats()
            and dst_ext.lower() in self.get_supported_output_formats()
        )

    @staticmethod
    def src_ext(input_path: str) -> str:
        return Path(input_path).suffix.lstrip(".").lower()

    @staticmethod
    def dst_ext(output_path: str) -> str:
        return Path(output_path).suffix.lstrip(".").lower()

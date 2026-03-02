from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class FormatGroup(BaseModel):
    input: List[str]
    output: List[str]


class SupportedFormats(BaseModel):
    image: FormatGroup
    audio: FormatGroup
    video: FormatGroup
    document: FormatGroup



class ConversionResult(BaseModel):
    original_name: str
    output_filename: str
    success: bool
    size: Optional[int] = None
    error: Optional[str] = None


class ConversionSession(BaseModel):
    session_id: str
    target_format: str
    results: List[ConversionResult]
    total: int = Field(..., description="Number of files submitted")
    successful: int = Field(..., description="Number of files converted successfully")

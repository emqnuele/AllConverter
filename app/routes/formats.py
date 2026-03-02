from __future__ import annotations
from functools import lru_cache
from fastapi import APIRouter
from app.converters.factory import ConverterFactory

router = APIRouter()


@lru_cache(maxsize=1)
def _cached_formats() -> dict:
    return ConverterFactory.get_format_map()


@router.get("/formats", summary="List all supported formats")
async def get_formats() -> dict:
    return _cached_formats()

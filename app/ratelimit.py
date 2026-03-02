from __future__ import annotations

from fastapi import Request
from slowapi import Limiter


def _get_real_ip(request: Request) -> str:
    from app.config import settings  # deferred to avoid circular import at module load

    if settings.TRUST_PROXY_HEADERS:
        xff = request.headers.get("X-Forwarded-For", "")
        if xff:
            return xff.split(",")[0].strip()
        x_real = request.headers.get("X-Real-IP", "")
        if x_real:
            return x_real.strip()
    return (request.client.host if request.client else None) or "unknown"


limiter = Limiter(key_func=_get_real_ip)

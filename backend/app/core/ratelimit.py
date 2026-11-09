"""Tiny in-memory fixed-window rate limiter for auth endpoints.

No external dependency: per-process counters are appropriate for serverless
instances (a real distributed limiter would need Redis; noted as a later
upgrade). Active only when DEBUG=false, so the test suite and local dev
are never throttled.
"""

import threading
import time

from fastapi import HTTPException, Request

from app.core.config import settings
from app.core.i18n import translate

WINDOW_SECONDS = 60

_lock = threading.Lock()
_counters: dict[tuple[str, str, int], int] = {}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(max_per_minute: int, scope: str):
    """Return a dependency that enforces a per-IP fixed-window limit."""

    async def _enforce(request: Request) -> None:
        if settings.DEBUG:
            return
        window = int(time.time() // WINDOW_SECONDS)
        key = (_client_ip(request), scope, window)
        with _lock:
            count = _counters.get(key, 0) + 1
            _counters[key] = count
            if len(_counters) > 10000:
                _counters.clear()
        if count > max_per_minute:
            lang = request.headers.get("accept-language", "en").split("-")[0].lower()
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "rate_limited",
                    "message": translate(lang, "rate_limited"),
                },
            )

    return _enforce

from __future__ import annotations

import threading
import time
from collections import deque
from functools import wraps

from flask import jsonify, request


class TokenBucket:
    def __init__(self, max_per_window: int, window_s: int) -> None:
        self._max = max_per_window
        self._window = window_s
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self._window
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and q[0] < cutoff:
                q.popleft()
            if len(q) >= self._max:
                return False
            q.append(now)
            return True


def rate_limit(bucket: TokenBucket, key_fn=None):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            key = key_fn() if key_fn else (request.headers.get("X-Forwarded-For") or request.remote_addr or "anon")
            if not bucket.allow(key):
                return jsonify({"error": "rate limit exceeded"}), 429
            return view(*args, **kwargs)
        return wrapper
    return decorator

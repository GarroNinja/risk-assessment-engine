from __future__ import annotations

import json
import logging
from typing import Any, Protocol

from config import CacheConfig

log = logging.getLogger(__name__)


class AiCache(Protocol):
    def get(self, key: str) -> Any | None: ...
    def set(self, key: str, value: Any, ttl_s: int | None = None) -> None: ...
    def delete(self, key: str) -> None: ...


class NullCache:
    def get(self, key: str) -> Any | None:
        return None

    def set(self, key: str, value: Any, ttl_s: int | None = None) -> None:
        return None

    def delete(self, key: str) -> None:
        return None


class RedisCache:
    def __init__(self, client: Any, default_ttl_s: int) -> None:
        self._c = client
        self._ttl = default_ttl_s

    def get(self, key: str) -> Any | None:
        try:
            raw = self._c.get(key)
        except Exception:
            log.exception("cache get failed for %s", key)
            return None
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (TypeError, ValueError):
            log.warning("cache value not json for %s", key)
            return None

    def set(self, key: str, value: Any, ttl_s: int | None = None) -> None:
        try:
            payload = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        except (TypeError, ValueError):
            log.warning("cache value not serialisable for %s", key)
            return
        try:
            self._c.set(key, payload, ex=ttl_s or self._ttl)
        except Exception:
            log.exception("cache set failed for %s", key)

    def delete(self, key: str) -> None:
        try:
            self._c.delete(key)
        except Exception:
            log.exception("cache delete failed for %s", key)


def build_cache(cfg: CacheConfig) -> AiCache:
    if not cfg.enabled:
        return NullCache()
    try:
        import redis  # type: ignore
    except ImportError:
        log.warning("redis package not installed; using NullCache")
        return NullCache()
    try:
        client = redis.Redis.from_url(cfg.url, decode_responses=True, socket_timeout=2)
        client.ping()
    except Exception:
        log.exception("redis unreachable; using NullCache")
        return NullCache()
    return RedisCache(client, cfg.default_ttl_s)

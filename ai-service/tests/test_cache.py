import pytest

from cache.cache_keys import build_key, hash_payload
from cache.redis_cache import NullCache, RedisCache


def test_hash_stability():
    p = {"a": 1, "b": "hello"}
    assert hash_payload(p) == hash_payload(p)
    assert hash_payload({"b": "hello", "a": 1}) == hash_payload({"a": 1, "b": "hello"})


def test_key_namespace():
    key = build_key("categorise", "v3", {"title": "x"})
    assert key.startswith("ai-svc:categorise:v3:")
    assert len(key.split(":")) == 4


def test_null_cache_noop():
    cache = NullCache()
    cache.set("k", {"data": "value"}, ttl_s=60)
    assert cache.get("k") is None
    cache.delete("k")


def test_redis_cache_round_trip():
    try:
        import fakeredis
    except ImportError:
        pytest.skip("fakeredis not installed")

    client = fakeredis.FakeRedis(decode_responses=True)
    cache = RedisCache(client, default_ttl_s=300)
    payload = {"category": "INJECTION", "confidence": 0.9}
    cache.set("test-key", payload, ttl_s=60)
    result = cache.get("test-key")
    assert result == payload
    cache.delete("test-key")
    assert cache.get("test-key") is None

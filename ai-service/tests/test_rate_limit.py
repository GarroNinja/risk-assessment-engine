import time

from middleware.rate_limit import TokenBucket


def test_allows_requests_under_limit():
    bucket = TokenBucket(max_per_window=5, window_s=60)
    for _ in range(5):
        assert bucket.allow("client-a") is True


def test_blocks_requests_over_limit():
    bucket = TokenBucket(max_per_window=3, window_s=60)
    for _ in range(3):
        bucket.allow("client-b")
    assert bucket.allow("client-b") is False


def test_keys_are_independent():
    bucket = TokenBucket(max_per_window=2, window_s=60)
    bucket.allow("key-x")
    bucket.allow("key-x")
    assert bucket.allow("key-x") is False
    assert bucket.allow("key-y") is True

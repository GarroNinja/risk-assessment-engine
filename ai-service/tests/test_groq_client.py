from unittest.mock import MagicMock, patch

import pytest

from clients.groq_client import GroqClient
from clients.groq_errors import GroqAuthError, GroqRateLimitError, GroqServerError
from config import GroqConfig


def _cfg() -> GroqConfig:
    return GroqConfig(
        api_key="test-key",
        base_url="https://api.groq.com/openai/v1",
        model="llama-3.1-70b-versatile",
        timeout_s=10.0,
        max_retries=2,
    )


def _ok_response(content: str = "hello") -> MagicMock:
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {
        "choices": [{"message": {"content": content}}],
        "model": "llama-3.1-70b-versatile",
        "usage": {},
    }
    return resp


def test_chat_ok():
    session = MagicMock()
    session.post.return_value = _ok_response("result text")
    client = GroqClient(_cfg(), session=session)
    data = client.chat([{"role": "user", "content": "hello"}])
    assert data["choices"][0]["message"]["content"] == "result text"
    assert session.post.call_count == 1


def test_auth_error_not_retried():
    session = MagicMock()
    auth_resp = MagicMock()
    auth_resp.status_code = 401
    auth_resp.json.return_value = {"error": {"message": "bad key"}}
    session.post.return_value = auth_resp
    client = GroqClient(_cfg(), session=session)
    with pytest.raises(GroqAuthError):
        client.chat([{"role": "user", "content": "hi"}])
    assert session.post.call_count == 1


def test_rate_limit_retried_then_raises(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    session = MagicMock()
    rate_resp = MagicMock()
    rate_resp.status_code = 429
    rate_resp.json.return_value = {"error": {"message": "too many"}}
    session.post.return_value = rate_resp
    client = GroqClient(_cfg(), session=session)
    with pytest.raises(GroqRateLimitError):
        client.chat([{"role": "user", "content": "hi"}])
    assert session.post.call_count == _cfg().max_retries + 1


def test_server_error_retried_then_succeeds(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda _: None)
    session = MagicMock()
    error_resp = MagicMock()
    error_resp.status_code = 500
    error_resp.json.return_value = {"error": {"message": "internal"}}
    session.post.side_effect = [error_resp, _ok_response("recovered")]
    client = GroqClient(_cfg(), session=session)
    data = client.chat([{"role": "user", "content": "hi"}])
    assert data["choices"][0]["message"]["content"] == "recovered"
    assert session.post.call_count == 2

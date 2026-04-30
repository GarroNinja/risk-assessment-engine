import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

import pytest


@pytest.fixture(autouse=True)
def _test_env(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("AI_CACHE_ENABLED", "false")
    monkeypatch.setenv("APP_ENV", "test")

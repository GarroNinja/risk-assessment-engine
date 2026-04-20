from __future__ import annotations

from typing import Any

import requests

from config import GroqConfig


class GroqClient:
    def __init__(self, cfg: GroqConfig, session: requests.Session | None = None) -> None:
        self._cfg = cfg
        self._session = session or requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {cfg.api_key}",
            "Content-Type": "application/json",
        })

    def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> dict[str, Any]:
        raise NotImplementedError("chat completion not wired yet")

    def close(self) -> None:
        self._session.close()

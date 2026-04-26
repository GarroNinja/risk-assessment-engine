from __future__ import annotations

import hashlib
import json
from typing import Any

KEY_PREFIX = "ai-svc"


def hash_payload(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def build_key(namespace: str, version: str, payload: Any) -> str:
    return f"{KEY_PREFIX}:{namespace}:{version}:{hash_payload(payload)}"

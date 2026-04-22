from __future__ import annotations

import json
import logging

from clients import GroqClient, GroqError
from prompts.categorise_prompts import CATEGORISE_SYSTEM_V1, build_categorise_user_v1
from schemas.categorise import (
    ALLOWED_CATEGORIES,
    ALLOWED_SEVERITY,
    CategoriseRequest,
    CategoriseResult,
)

log = logging.getLogger(__name__)


class CategoriserError(Exception):
    pass


class Categoriser:
    def __init__(self, groq: GroqClient) -> None:
        self._groq = groq

    def categorise(self, req: CategoriseRequest) -> CategoriseResult:
        messages = [
            {"role": "system", "content": CATEGORISE_SYSTEM_V1},
            {"role": "user", "content": build_categorise_user_v1(req.title, req.description, req.context)},
        ]
        try:
            resp = self._groq.chat(
                messages,
                temperature=0.1,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
        except GroqError as exc:
            raise CategoriserError(f"groq call failed: {exc}") from exc

        content = resp["choices"][0]["message"]["content"]
        return _parse_result(content)


def _parse_result(content: str) -> CategoriseResult:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise CategoriserError(f"model returned non-json: {exc}") from exc

    category = str(data.get("category", "")).upper()
    if category not in ALLOWED_CATEGORIES:
        category = "OTHER"

    severity = str(data.get("severity", "")).upper()
    if severity not in ALLOWED_SEVERITY:
        severity = "MEDIUM"

    try:
        confidence = float(data.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    rationale = str(data.get("rationale", "")).strip()[:1000]

    tags_raw = data.get("tags", [])
    tags = [str(t).strip() for t in tags_raw if str(t).strip()][:10] if isinstance(tags_raw, list) else []

    return CategoriseResult(
        category=category,
        severity=severity,
        confidence=confidence,
        rationale=rationale,
        tags=tags,
    )

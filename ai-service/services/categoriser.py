from __future__ import annotations

import json
import logging

from cache import AiCache, NullCache, build_key
from clients import GroqClient, GroqError
from prompts.categorise_prompts import (
    CATEGORISE_SYSTEM_V1,
    CATEGORISE_SYSTEM_V2,
    build_categorise_user_v1,
    build_categorise_user_v2,
)
from schemas.categorise import (
    ALLOWED_CATEGORIES,
    ALLOWED_SEVERITY,
    CategoriseRequest,
    CategoriseResult,
)

log = logging.getLogger(__name__)

_CACHE_NS = "categorise"


class CategoriserError(Exception):
    pass


class Categoriser:
    def __init__(
        self,
        groq: GroqClient,
        cache: AiCache | None = None,
        prompt_version: str = "v2",
        cache_ttl_s: int = 900,
    ) -> None:
        self._groq = groq
        self._cache = cache or NullCache()
        self._prompt_version = prompt_version
        self._cache_ttl = cache_ttl_s

    def categorise(self, req: CategoriseRequest) -> CategoriseResult:
        key = build_key(_CACHE_NS, self._prompt_version, {
            "title": req.title,
            "description": req.description,
            "context": req.context,
        })
        cached = self._cache.get(key)
        if cached is not None:
            log.info("categorise cache hit")
            return CategoriseResult(**cached)

        if self._prompt_version == "v1":
            system = CATEGORISE_SYSTEM_V1
            user = build_categorise_user_v1(req.title, req.description, req.context)
        else:
            system = CATEGORISE_SYSTEM_V2
            user = build_categorise_user_v2(req.title, req.description, req.context)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
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
        result = _parse_result(content)
        self._cache.set(key, result.to_dict(), ttl_s=self._cache_ttl)
        return result


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

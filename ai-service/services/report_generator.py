from __future__ import annotations

import logging
from dataclasses import asdict
from typing import Iterator

from cache import AiCache, NullCache, build_key
from clients import GroqClient, GroqError
from prompts.report_prompts import REPORT_SYSTEM_V2, build_report_user_v2
from schemas.report import ReportRequest, ReportResult

log = logging.getLogger(__name__)

_CACHE_NS = "report"
_CACHE_VERSION = "v2"


class ReportGeneratorError(Exception):
    pass


class ReportGenerator:
    def __init__(
        self,
        groq: GroqClient,
        cache: AiCache | None = None,
        cache_ttl_s: int = 900,
    ) -> None:
        self._groq = groq
        self._cache = cache or NullCache()
        self._cache_ttl = cache_ttl_s

    def _messages(self, req: ReportRequest) -> list[dict[str, str]]:
        return [
            {"role": "system", "content": REPORT_SYSTEM_V2},
            {
                "role": "user",
                "content": build_report_user_v2(
                    risks=[asdict(r) for r in req.risks],
                    audience=req.audience,
                    fmt=req.format,
                    project_name=req.project_name,
                ),
            },
        ]

    def _cache_key(self, req: ReportRequest) -> str:
        return build_key(_CACHE_NS, _CACHE_VERSION, {
            "audience": req.audience,
            "format": req.format,
            "project_name": req.project_name,
            "risks": [asdict(r) for r in req.risks],
        })

    def generate(self, req: ReportRequest) -> ReportResult:
        key = self._cache_key(req)
        cached = self._cache.get(key)
        if cached is not None:
            log.info("report cache hit")
            return ReportResult(**cached)

        try:
            resp = self._groq.chat(
                self._messages(req),
                temperature=0.3,
                max_tokens=2048,
            )
        except GroqError as exc:
            raise ReportGeneratorError(f"groq call failed: {exc}") from exc

        content = resp["choices"][0]["message"]["content"].strip()
        result = ReportResult(
            content=content,
            audience=req.audience,
            format=req.format,
            risk_count=len(req.risks),
            metadata={"model": resp.get("model"), "usage": resp.get("usage", {})},
        )
        self._cache.set(key, result.to_dict(), ttl_s=self._cache_ttl)
        return result

    def generate_stream(self, req: ReportRequest) -> Iterator[str]:
        try:
            yield from self._groq.chat_stream(
                self._messages(req),
                temperature=0.3,
                max_tokens=2048,
            )
        except GroqError as exc:
            raise ReportGeneratorError(f"groq stream failed: {exc}") from exc

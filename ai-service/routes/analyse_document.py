from __future__ import annotations

import json
import logging

from flask import Blueprint, current_app, jsonify, request

from clients import GroqClient
from clients.groq_errors import GroqError
from middleware.rate_limit import TokenBucket, rate_limit

log = logging.getLogger(__name__)

analyse_doc_bp = Blueprint("analyse_document", __name__)
_bucket = TokenBucket(max_per_window=10, window_s=60)


@analyse_doc_bp.post("/analyse-document")
@rate_limit(_bucket)
def analyse_document():
    body = request.get_json(silent=True) or {}
    text = body.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "text is required"}), 400

    groq: GroqClient = current_app.extensions["groq"]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a security auditor. Analyse the provided document or text for security risks.\n\n"
                "Respond with JSON matching this schema exactly:\n"
                "{\n"
                '  "findings": [\n'
                '    {"title": "...", "severity": "Low|Medium|High|Critical", "description": "...", "recommendation": "..."}\n'
                "  ],\n"
                '  "summary": "..."\n'
                "}\n"
                "List all identified risks. If no risks are found, return an empty findings array with an appropriate summary. "
                "No prose outside JSON."
            ),
        },
        {"role": "user", "content": text.strip()},
    ]
    try:
        resp = groq.chat(
            messages,
            temperature=0.1,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
    except GroqError as exc:
        log.warning("analyse-document groq error: %s", exc)
        return jsonify({"error": "AI service unavailable", "detail": str(exc)}), 503

    content = resp["choices"][0]["message"]["content"]
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return jsonify({"error": "model returned invalid JSON"}), 502

    findings = data.get("findings", [])
    if not isinstance(findings, list):
        findings = []

    return jsonify({
        "findings": findings,
        "summary": str(data.get("summary", "")),
    }), 200

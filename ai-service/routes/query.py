from __future__ import annotations

import logging

from flask import Blueprint, current_app, jsonify, request

from clients import GroqClient
from clients.groq_errors import GroqError
from middleware.rate_limit import TokenBucket, rate_limit

log = logging.getLogger(__name__)

query_bp = Blueprint("query", __name__)
_bucket = TokenBucket(max_per_window=30, window_s=60)


@query_bp.post("/query")
@rate_limit(_bucket)
def query():
    body = request.get_json(silent=True) or {}
    question = body.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return jsonify({"error": "question is required"}), 400

    groq: GroqClient = current_app.extensions["groq"]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a security knowledge assistant with deep expertise in application security, "
                "OWASP, CVEs, and secure development practices. "
                "Answer questions accurately and concisely. "
                "If a question is outside security, politely decline and redirect."
            ),
        },
        {"role": "user", "content": question.strip()},
    ]
    try:
        resp = groq.chat(messages, temperature=0.3, max_tokens=1024)
    except GroqError as exc:
        log.warning("query groq error: %s", exc)
        return jsonify({"error": "AI service unavailable", "detail": str(exc)}), 503

    answer = resp["choices"][0]["message"]["content"].strip()
    return jsonify({"answer": answer}), 200

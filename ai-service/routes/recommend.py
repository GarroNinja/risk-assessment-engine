from __future__ import annotations

import json
import logging

from flask import Blueprint, current_app, jsonify, request

from clients import GroqClient
from clients.groq_errors import GroqError
from middleware.rate_limit import TokenBucket, rate_limit

log = logging.getLogger(__name__)

recommend_bp = Blueprint("recommend", __name__)
_bucket = TokenBucket(max_per_window=20, window_s=60)


@recommend_bp.post("/recommend")
@rate_limit(_bucket)
def recommend():
    body = request.get_json(silent=True) or {}
    text = body.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "text is required"}), 400

    groq: GroqClient = current_app.extensions["groq"]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a security engineer. Given a description of a security risk, "
                "produce concrete remediation recommendations.\n\n"
                "Respond with JSON matching this schema exactly:\n"
                '{"recommendations": [{"priority": "High|Medium|Low", "title": "...", "description": "..."}]}\n'
                "Provide 3-5 recommendations ordered by priority. No prose outside JSON."
            ),
        },
        {"role": "user", "content": text.strip()},
    ]
    try:
        resp = groq.chat(
            messages,
            temperature=0.2,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
    except GroqError as exc:
        log.warning("recommend groq error: %s", exc)
        return jsonify({"error": "AI service unavailable", "detail": str(exc)}), 503

    content = resp["choices"][0]["message"]["content"]
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return jsonify({"error": "model returned invalid JSON"}), 502

    recs = data.get("recommendations", [])
    if not isinstance(recs, list):
        recs = []

    return jsonify({"recommendations": recs}), 200

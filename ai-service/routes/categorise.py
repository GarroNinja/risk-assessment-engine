from __future__ import annotations

import logging

from flask import Blueprint, current_app, jsonify, request

from middleware.rate_limit import TokenBucket, rate_limit
from schemas.categorise import CategoriseRequest
from services.categoriser import Categoriser, CategoriserError
from services.fallbacks import categorise_fallback

log = logging.getLogger(__name__)

bp = Blueprint("categorise", __name__)
_bucket = TokenBucket(max_per_window=30, window_s=60)


@bp.post("/categorise")
@rate_limit(_bucket)
def categorise():
    try:
        body = request.get_json(force=True, silent=False)
    except Exception:
        return jsonify({"error": "invalid json body"}), 400

    try:
        req = CategoriseRequest.from_json(body)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    cat: Categoriser = current_app.extensions["categoriser"]
    try:
        result = cat.categorise(req)
    except CategoriserError as exc:
        log.warning("categorise primary failed, falling back: %s", exc)
        result = categorise_fallback(req)
        return jsonify({**result.to_dict(), "degraded": True}), 200

    return jsonify(result.to_dict()), 200

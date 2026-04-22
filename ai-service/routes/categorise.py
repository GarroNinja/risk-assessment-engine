from __future__ import annotations

import logging

from flask import Blueprint, current_app, jsonify, request

from schemas.categorise import CategoriseRequest
from services.categoriser import Categoriser, CategoriserError

log = logging.getLogger(__name__)

bp = Blueprint("categorise", __name__)


@bp.post("/categorise")
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
        log.exception("categorise failed")
        return jsonify({"error": "categorisation failed", "detail": str(exc)}), 502

    return jsonify(result.to_dict()), 200

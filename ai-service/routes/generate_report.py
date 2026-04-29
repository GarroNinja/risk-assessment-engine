from __future__ import annotations

import json
import logging

from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context

from middleware.rate_limit import TokenBucket, rate_limit
from schemas.report import ReportRequest
from services.fallbacks import report_fallback
from services.report_generator import ReportGenerator, ReportGeneratorError

log = logging.getLogger(__name__)

bp = Blueprint("generate_report", __name__)
_bucket = TokenBucket(max_per_window=10, window_s=60)


def _parse_body() -> tuple[ReportRequest | None, tuple[Response, int] | None]:
    try:
        body = request.get_json(force=True, silent=False)
    except Exception:
        return None, (jsonify({"error": "invalid json body"}), 400)
    try:
        return ReportRequest.from_json(body), None
    except ValueError as exc:
        return None, (jsonify({"error": str(exc)}), 400)


@bp.post("/generate-report")
@rate_limit(_bucket)
def generate_report():
    req, err = _parse_body()
    if err is not None:
        return err
    gen: ReportGenerator = current_app.extensions["report_generator"]
    try:
        result = gen.generate(req)
    except ReportGeneratorError as exc:
        log.warning("report primary failed, falling back: %s", exc)
        result = report_fallback(req)
        return jsonify({**result.to_dict(), "degraded": True}), 200
    return jsonify(result.to_dict()), 200


@bp.post("/generate-report/stream")
@rate_limit(_bucket)
def generate_report_stream():
    req, err = _parse_body()
    if err is not None:
        return err
    gen: ReportGenerator = current_app.extensions["report_generator"]

    def event_stream():
        try:
            for piece in gen.generate_stream(req):
                yield f"data: {json.dumps({'delta': piece})}\n\n"
            yield "data: [DONE]\n\n"
        except ReportGeneratorError as exc:
            log.warning("report stream failed, sending fallback: %s", exc)
            fallback = report_fallback(req)
            err_payload = json.dumps({"error": str(exc), "degraded": True})
            yield f"event: error\ndata: {err_payload}\n\n"
            yield f"data: {json.dumps({'delta': fallback.content})}\n\n"
            yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

from flask import jsonify, request

_MAX_FIELD_BYTES = 50_000


def security_middleware():
    if request.method not in ("POST", "PUT", "PATCH"):
        return None

    if not request.is_json:
        return jsonify({"error": "content-type must be application/json"}), 400

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "request body must be a JSON object"}), 400

    for key, value in data.items():
        if isinstance(value, str) and len(value.encode("utf-8")) > _MAX_FIELD_BYTES:
            return jsonify({"error": "field exceeds maximum size", "field": key}), 400

    return None

from flask import Blueprint, request, jsonify
from services.sanitizer import sanitize_input

test_bp = Blueprint("test", __name__)

@test_bp.route("/test", methods=["POST"])
def test():
    data = request.json

    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]

    cleaned_text, error = sanitize_input(text)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Safe input received",
        "cleaned_text": cleaned_text
    })
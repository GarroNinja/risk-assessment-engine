from flask import Blueprint, request, jsonify

# Create Blueprint
describe_bp = Blueprint("describe", __name__)

# Route: /ai/describe
@describe_bp.route("/describe", methods=["POST"])
def describe():
    try:
        data = request.get_json()

        # Safely extract input
        input_text = data.get("input", {}).get("text", "")

        # Validation
        if not input_text:
            return jsonify({
                "status": "error",
                "message": "Input text is required"
            }), 400

        # Day 1 response (no AI yet)
        return jsonify({
            "status": "success",
            "message": "Describe endpoint working",
            "input": {
                "text": input_text
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500 
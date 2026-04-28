from flask import request, jsonify
import re

def security_middleware():
    if request.method in ["POST", "PUT", "PATCH"]:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        if not data:
            return jsonify({"error": "Empty request body"}), 400

        for key, value in data.items():
            if not isinstance(value, str):
                return jsonify({
                    "error": "Invalid input type",
                    "field": key
                }), 400

            # HTML removal
            value = re.sub(r'<.*?>', '', value)

            lower = value.lower()

            # Prompt Injection
            if any(x in lower for x in [
                "ignore previous instructions",
                "system prompt",
                "bypass",
                "override",
                "act as",
                "jailbreak"
            ]):
                return jsonify({
                    "error": "Prompt injection detected",
                    "field": key
                }), 400

            # SQL Injection
            if re.search(r"(select|drop|insert|delete|update|--|;)", lower):
                return jsonify({
                    "error": "SQL injection detected",
                    "field": key
                }), 400

    return None
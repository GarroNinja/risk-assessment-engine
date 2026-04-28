from flask import Flask, jsonify
from routes.test_routes import test_bp
from middleware.security_middleware import security_middleware

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.errors import RateLimitExceeded

app = Flask(__name__)

# 🔐 Rate limiter (Day 4)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["30 per minute"]
)

# 🔐 Middleware (Day 3)
@app.before_request
def before_request():
    return security_middleware()

# 🔐 Custom 429 response (Day 4)
@app.errorhandler(RateLimitExceeded)
def handle_rate_limit(e):
    return jsonify({
        "error": "Rate limit exceeded",
        "retry_after": str(e.description)
    }), 429

# ✅ Register routes
app.register_blueprint(test_bp)

# ✅ Health endpoint (no middleware restriction)
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "AI service is running"
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
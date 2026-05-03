import os

from flask import Flask, jsonify
from flask_cors import CORS

from app_extensions import init_ai_extensions
from middleware.security_middleware import security_middleware
from routes.analyse_document import analyse_doc_bp
from routes.categorise import bp as categorise_bp
from routes.describe import describe_bp
from routes.generate_report import bp as report_bp
from routes.query import query_bp
from routes.recommend import recommend_bp


def create_app() -> Flask:
    app = Flask(__name__)

    origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, origins=origins)

    app.before_request(security_middleware)

    init_ai_extensions(app)

    app.register_blueprint(categorise_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(describe_bp)
    app.register_blueprint(recommend_bp)
    app.register_blueprint(query_bp)
    app.register_blueprint(analyse_doc_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)

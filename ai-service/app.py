from flask import Flask

def create_app():
    app = Flask(__name__)

    from routes.describe import describe_bp
    app.register_blueprint(describe_bp, url_prefix="/ai")

    # ✅ Health route (inside create_app)
    @app.route("/health")
    def health():
        return {"status": "AI service running"}

    return app

# ✅ THIS PART IS VERY IMPORTANT (you might be missing this)
if __name__ == "__main__":
    app = create_app()
    app.run(port=5000, debug=True)
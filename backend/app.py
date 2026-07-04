import os
import sys
from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

# ── Path setup ────────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).parent          # …/backend/
ROOT_DIR    = BACKEND_DIR.parent             # …/record-tracker/

sys.path.insert(0, str(BACKEND_DIR))

from backend.config import Config
from models.record import seed_db
from routes.records import bp as records_bp

# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder=str(ROOT_DIR),   # serve root as static files
        static_url_path="",
    )
    CORS(app)

    # ── MongoDB ──────────────────────────────────────────────────────────────
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=4000)
        client.server_info()           # raise if unreachable
        app.db = client[Config.DB_NAME]
        # Only auto-seed in the main process (not the Werkzeug reloader child)
        # and only when the collection is empty.
        # Set SKIP_SEED=true in .env to disable auto-seeding entirely.
        import os as _os
        is_reloader_child = _os.environ.get('WERKZEUG_RUN_MAIN') == 'true'
        skip_seed = Config.SKIP_SEED
        if not skip_seed and not is_reloader_child:
            seed_db(app.db["records"])
        print(f"[OK]  MongoDB connected — db: {Config.DB_NAME}")
    except ServerSelectionTimeoutError:
        print("[ERROR]  MongoDB not reachable — is mongod running?")
        print(f"    URI tried: {Config.MONGO_URI}")
        sys.exit(1)

    # ── Register blueprints ───────────────────────────────────────────────────
    app.register_blueprint(records_bp)

    # ── Serve frontend pages ──────────────────────────────────────────────────
    @app.route("/")
    def index():
        return send_from_directory(str(ROOT_DIR), "index.html")

    @app.route("/pages/<path:filename>")
    def pages(filename):
        return send_from_directory(str(ROOT_DIR / "pages"), filename)

    @app.route("/css/<path:filename>")
    def css(filename):
        return send_from_directory(str(ROOT_DIR / "css"), filename)

    @app.route("/js/<path:filename>")
    def js(filename):
        return send_from_directory(str(ROOT_DIR / "js"), filename)

    return app


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    print(f"[START]  RecordGuard running at http://localhost:{Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)

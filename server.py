#!/usr/bin/env python3
"""
isdown - Real-Time AI & Cloud Outage Radar Server
Supports:
  1. Static asset serving with cache-busting headers for data/status.json
  2. PostgreSQL persistence when DATABASE_URL is injected (for usectl / container platforms)
  3. Graceful fallback to data/subscribers.json if PostgreSQL is not configured
  4. Automatic background status sync thread (polls OpenAI, Claude, GitHub every 5 mins)
"""

import sys
import os
import json
import threading
import time
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Import sync engine for background updates
try:
    from scripts.sync import update_status_dataset
except ImportError:
    update_status_dataset = None

# Detect PostgreSQL
try:
    import psycopg2
    from psycopg2 import pool
except ImportError:
    psycopg2 = None
    pool = None

# Configuration
PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SUBSCRIBERS_FILE = os.path.join(DIRECTORY, "data", "subscribers.json")
ENABLE_BACKGROUND_SYNC = os.environ.get("ENABLE_BACKGROUND_SYNC", "true").lower() in ("true", "1", "yes")
SYNC_INTERVAL_SECONDS = int(os.environ.get("SYNC_INTERVAL_SECONDS", 300))

def resolve_database_url():
    candidates = [
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRESQL_URL",
        "DB_URL",
        "PG_URL",
        "DATABASE_CONNECTION_STRING",
        "POSTGRES_CONNECTION_STRING",
        "USECTL_DATABASE_URL",
        "USECTL_POSTGRES_URL"
    ]
    for key in candidates:
        val = os.environ.get(key)
        if val and val.strip():
            url = val.strip()
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url, key

    user = os.environ.get("POSTGRES_USER") or os.environ.get("PGUSER")
    password = os.environ.get("POSTGRES_PASSWORD") or os.environ.get("PGPASSWORD")
    host = os.environ.get("POSTGRES_HOST") or os.environ.get("PGHOST")
    port = os.environ.get("POSTGRES_PORT") or os.environ.get("PGPORT", "5432")
    dbname = os.environ.get("POSTGRES_DB") or os.environ.get("PGDATABASE")

    if host and dbname:
        auth = f"{user}:{password}@" if user and password else (f"{user}@" if user else "")
        url = f"postgresql://{auth}{host}:{port}/{dbname}"
        return url, "composed_discrete_vars"

    return None, None

DATABASE_URL, DATABASE_SOURCE_VAR = resolve_database_url()

# PostgreSQL Connection Pool and Status Tracker
db_pool = None
db_status = {
    "configured": bool(DATABASE_URL),
    "source_variable": DATABASE_SOURCE_VAR,
    "connected": False,
    "engine": "postgresql" if DATABASE_URL else "json",
    "table_ready": False,
    "subscribers_count": 0,
    "error": None,
    "last_check": None
}

def init_db():
    global db_pool, db_status, DATABASE_URL, DATABASE_SOURCE_VAR
    if not DATABASE_URL:
        DATABASE_URL, DATABASE_SOURCE_VAR = resolve_database_url()

    db_status["last_check"] = datetime.now(timezone.utc).isoformat()
    db_status["configured"] = bool(DATABASE_URL)
    db_status["source_variable"] = DATABASE_SOURCE_VAR

    if not DATABASE_URL:
        print("[INFO] No DATABASE_URL or PostgreSQL env vars found. Operating with local JSON subscriber storage.")
        db_status["configured"] = False
        db_status["engine"] = "json"
        return

    if not psycopg2:
        err_msg = "DATABASE_URL provided, but psycopg2 is not installed. Fallback to local JSON."
        print(f"[WARN] {err_msg}")
        db_status["error"] = err_msg
        db_status["engine"] = "json_fallback"
        return

    try:
        db_pool = pool.SimpleConnectionPool(1, 10, DATABASE_URL)
        conn = db_pool.getconn()
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS subscribers (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(32) NOT NULL DEFAULT 'email',
                    target VARCHAR(255) NOT NULL UNIQUE,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
        db_pool.putconn(conn)
        db_status["connected"] = True
        db_status["engine"] = "postgresql"
        db_status["table_ready"] = True
        db_status["error"] = None
        print("[SUCCESS] Connected to PostgreSQL! Subscribers table initialized and migrated.")
    except Exception as err:
        err_msg = str(err)
        print(f"[ERROR] Failed to connect to PostgreSQL: {err_msg}. Fallback to JSON.", file=sys.stderr)
        db_pool = None
        db_status["connected"] = False
        db_status["engine"] = "json_fallback"
        db_status["error"] = err_msg

def get_db_diagnostics():
    global db_pool, DATABASE_URL, DATABASE_SOURCE_VAR
    # If not yet connected, re-attempt resolution in case env vars were set
    if not db_pool:
        init_db()

    diag = dict(db_status)
    diag["last_check"] = datetime.now(timezone.utc).isoformat()
    if db_pool:
        try:
            conn = db_pool.getconn()
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM subscribers;")
                diag["subscribers_count"] = cur.fetchone()[0]
                cur.execute("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'subscribers'
                    ORDER BY ordinal_position;
                """)
                diag["schema"] = [{"column": row[0], "type": row[1]} for row in cur.fetchall()]
            db_pool.putconn(conn)
            diag["connected"] = True
            diag["table_ready"] = True
            diag["error"] = None
        except Exception as e:
            diag["connected"] = False
            diag["error"] = str(e)
    else:
        if os.path.exists(SUBSCRIBERS_FILE):
            try:
                with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
                    diag["subscribers_count"] = len(json.load(f).get("subscribers", []))
            except Exception:
                diag["subscribers_count"] = 0
    return diag

def save_subscriber_postgres(sub_type, target):
    if not db_pool:
        return None
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO subscribers (type, target, active, updated_at)
                VALUES (%s, %s, TRUE, CURRENT_TIMESTAMP)
                ON CONFLICT (target) DO UPDATE
                SET active = TRUE, updated_at = CURRENT_TIMESTAMP
                RETURNING id, type, target, active, created_at;
            """, (sub_type, target))
            row = cur.fetchone()
            conn.commit()
            return {
                "id": str(row[0]),
                "type": row[1],
                "target": row[2],
                "active": row[3],
                "createdAt": row[4].isoformat() if row[4] else datetime.now(timezone.utc).isoformat()
            }
    finally:
        db_pool.putconn(conn)

def remove_subscriber_postgres(target):
    if not db_pool:
        return False
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE subscribers SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE target = %s;", (target,))
            conn.commit()
            return True
    finally:
        db_pool.putconn(conn)

def list_subscribers_postgres():
    if not db_pool:
        return None
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, type, target, active, created_at FROM subscribers WHERE active = TRUE ORDER BY created_at DESC;")
            rows = cur.fetchall()
            return [
                {
                    "id": str(r[0]),
                    "type": r[1],
                    "target": r[2],
                    "active": r[3],
                    "createdAt": r[4].isoformat() if r[4] else ""
                }
                for r in rows
            ]
    finally:
        db_pool.putconn(conn)

def save_subscriber_json(sub_type, target):
    subscribers_data = {"subscribers": [], "lastUpdated": ""}
    if os.path.exists(SUBSCRIBERS_FILE):
        try:
            with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
                subscribers_data = json.load(f)
        except Exception:
            pass

    new_sub = {
        "id": f"sub-{int(datetime.now(timezone.utc).timestamp())}",
        "type": sub_type,
        "target": target,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "active": True
    }

    subscribers_data["subscribers"] = [
        s for s in subscribers_data.get("subscribers", [])
        if s.get("target") != target
    ]
    subscribers_data["subscribers"].append(new_sub)
    subscribers_data["lastUpdated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
        json.dump(subscribers_data, f, indent=2)

    return new_sub

def remove_subscriber_json(target):
    if not os.path.exists(SUBSCRIBERS_FILE):
        return False
    try:
        with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["subscribers"] = [s for s in data.get("subscribers", []) if s.get("target") != target]
        with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception:
        return False

# Background Sync Thread
def background_sync_worker():
    print(f"[INFO] Background status sync loop enabled (interval: {SYNC_INTERVAL_SECONDS}s).")
    while True:
        try:
            time.sleep(SYNC_INTERVAL_SECONDS)
            if update_status_dataset:
                update_status_dataset(dry_run=False)
        except Exception as e:
            print(f"[WARN] Error in background sync: {e}", file=sys.stderr)

class StatusRadarHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == "/api/subscribe":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode("utf-8"))
                target = payload.get("target") or payload.get("email") or payload.get("webhook")
                sub_type = payload.get("type", "email")

                if not target:
                    self._json_response(400, {"error": "Target email or webhook is required"})
                    return

                # Save to PostgreSQL if available, else JSON
                saved = None
                storage = "json"
                if db_pool:
                    try:
                        saved = save_subscriber_postgres(sub_type, target)
                        storage = "postgres"
                    except Exception as pg_err:
                        print(f"[WARN] PostgreSQL insert failed: {pg_err}. Falling back to JSON.")

                if not saved:
                    saved = save_subscriber_json(sub_type, target)

                self._json_response(200, {
                    "success": True,
                    "message": f"Successfully subscribed {target}",
                    "subscriber": saved,
                    "storage": storage
                })
                return
            except Exception as err:
                self._json_response(500, {"error": str(err)})
                return

        elif self.path == "/api/unsubscribe":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode("utf-8"))
                target = payload.get("target")
                if not target:
                    self._json_response(400, {"error": "Target is required"})
                    return

                if db_pool:
                    remove_subscriber_postgres(target)
                remove_subscriber_json(target)

                self._json_response(200, {"success": True, "message": f"Unsubscribed {target}"})
                return
            except Exception as err:
                self._json_response(500, {"error": str(err)})
                return

        super().do_GET()

    def do_GET(self):
        clean_path = self.path.split("?")[0]

        if clean_path in ("/health", "/api/health", "/api/db-status"):
            diag = get_db_diagnostics()
            is_healthy = diag["connected"] or not DATABASE_URL
            status_code = 200 if is_healthy else 503
            detected_keys = [k for k in os.environ.keys() if any(w in k.upper() for w in ("POSTGRES", "DATABASE", "DB", "PG"))]
            self._json_response(status_code, {
                "status": "healthy" if is_healthy else "degraded",
                "app": "isdown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database": diag,
                "environment": {
                    "database_url_configured": bool(DATABASE_URL),
                    "database_source_var": DATABASE_SOURCE_VAR,
                    "detected_db_env_keys": detected_keys,
                    "background_sync": ENABLE_BACKGROUND_SYNC,
                    "port": PORT
                }
            })
            return

        if clean_path == "/api/subscribers":
            # For subscriber privacy, public listing is disabled
            self._json_response(403, {"error": "Subscriber listing is private and disabled"})
            return

        super().do_GET()

    def _json_response(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def end_headers(self):
        # Disable caching for HTML, JS, CSS, JSON, and XML so deployments update instantly
        clean_path = self.path.split("?")[0]
        if (clean_path.endswith(".html") or clean_path.endswith("/") or clean_path == "" or
            clean_path.endswith(".js") or clean_path.endswith(".css") or 
            clean_path.endswith(".json") or clean_path.endswith(".xml")):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".js"):
            return "application/javascript"
        if path.endswith(".json"):
            return "application/json"
        if path.endswith(".xml"):
            return "application/xml"
        if path.endswith(".svg"):
            return "image/svg+xml"
        if path.endswith(".png"):
            return "image/png"
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        return super().guess_type(path)

def run():
    init_db()

    # Start background sync if enabled
    if ENABLE_BACKGROUND_SYNC and update_status_dataset:
        sync_thread = threading.Thread(target=background_sync_worker, daemon=True)
        sync_thread.start()

    server_address = ("", PORT)
    httpd = HTTPServer(server_address, StatusRadarHandler)
    print("=" * 60)
    print(f"🚀 isdown server running on port {PORT}")
    print(f"👉 http://localhost:{PORT}")
    print(f"📁 Serving: {DIRECTORY}")
    if DATABASE_URL and db_pool:
        print("🐘 Storage: PostgreSQL Connected")
    else:
        print("📄 Storage: Local JSON (data/subscribers.json)")
    print("=" * 60)
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run()

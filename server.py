#!/usr/bin/env python3
"""
Status Radar - Zero-Dependency Local Preview Server
Serves the static status site with proper MIME types and no-cache headers for data/status.json.
"""

import sys
import os
import json
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SUBSCRIBERS_FILE = os.path.join(DIRECTORY, "data", "subscribers.json")

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
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Target email or webhook is required"}).encode("utf-8"))
                    return

                # Load existing subscribers
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

                # Deduplicate by target
                subscribers_data["subscribers"] = [
                    s for s in subscribers_data.get("subscribers", [])
                    if s.get("target") != target
                ]
                subscribers_data["subscribers"].append(new_sub)
                subscribers_data["lastUpdated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

                with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
                    json.dump(subscribers_data, f, indent=2)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "message": f"Successfully subscribed {target}",
                    "subscriber": new_sub,
                    "totalSubscribers": len(subscribers_data["subscribers"])
                }).encode("utf-8"))
                return
            except Exception as err:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(err)}).encode("utf-8"))
                return

        super().do_GET()

    def end_headers(self):
        # Disable caching for live data so polling updates instantly
        if self.path.endswith(".json") or self.path.endswith(".xml"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
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
        return super().guess_type(path)

def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, StatusRadarHandler)
    print("=" * 60)
    print(f"🚀 Status Radar static server running at:")
    print(f"👉 http://localhost:{PORT}")
    print(f"📁 Serving from: {DIRECTORY}")
    print("=" * 60)
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run()

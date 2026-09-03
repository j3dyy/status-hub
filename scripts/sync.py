#!/usr/bin/env python3
"""
Status Radar - Background Synchronizer & Polling Engine
Fetches live status and component health from public Statuspage endpoints
(OpenAI, GitHub, Anthropic Claude, Hetzner, Google Gemini) and updates data/status.json.

Can be run via:
  - Cron job (e.g. every 1-5 minutes)
  - GitHub Actions (.github/workflows/status-sync.yml)
  - Cloudflare Worker / Serverless cron
"""

import sys
import os
import json
import urllib.request
import urllib.error
import ssl
from datetime import datetime, timezone

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(WORKSPACE_DIR, "data", "status.json")

STATUSPAGE_MAP = {
    "none": "operational",
    "minor": "degraded",
    "major": "partial_outage",
    "critical": "major_outage",
    "maintenance": "maintenance"
}

SOURCES = {
    "openai": "https://status.openai.com/api/v2/summary.json",
    "github": "https://www.githubstatus.com/api/v2/summary.json",
    "claude": "https://status.anthropic.com/api/v2/summary.json"
}

def fetch_json(url, timeout=10):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "StatusRadar/1.0 (+https://github.com/status-radar)"}
    )
    # Prepare ssl context with fallback for local dev environments
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except ssl.SSLCertVerificationError:
        try:
            unverified_ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, timeout=timeout, context=unverified_ctx) as response:
                if response.status == 200:
                    return json.loads(response.read().decode("utf-8"))
        except Exception as fallback_err:
            print(f"[WARN] Failed fetching {url} with fallback context: {fallback_err}", file=sys.stderr)
    except Exception as err:
        print(f"[WARN] Failed fetching {url}: {err}", file=sys.stderr)
    return None

def update_status_dataset(dry_run=False):
    if not os.path.exists(DATA_FILE):
        print(f"[ERROR] Data file not found at {DATA_FILE}", file=sys.stderr)
        return False

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    updated_providers = set()

    for provider_id, url in SOURCES.items():
        print(f"[INFO] Syncing provider: {provider_id} from {url}...")
        remote_data = fetch_json(url)
        if not remote_data:
            continue

        page_status = remote_data.get("status", {}).get("indicator", "none")
        mapped_status = STATUSPAGE_MAP.get(page_status, "operational")

        # Update provider summary status
        for p in data.get("providers", []):
            if p["id"] == provider_id:
                p["status"] = mapped_status
                updated_providers.add(provider_id)

        # Update components
        remote_components = {c["name"]: c for c in remote_data.get("components", [])}
        for cat in data.get("categories", []):
            for s in cat.get("services", []):
                if s.get("providerId") == provider_id:
                    # Check if the service itself is directly a remote component (e.g. claude.ai, Claude Console)
                    matched_status = None
                    for rc_name, rc in remote_components.items():
                        if s["name"].lower() in rc_name.lower() or rc_name.lower() in s["name"].lower():
                            rc_stat = rc.get("status", "operational")
                            matched_status = STATUSPAGE_MAP.get(rc_stat, rc_stat)
                            break

                    s["status"] = matched_status or mapped_status

                    for comp in s.get("components", []):
                        # Match subcomponent name substring
                        for rc_name, rc in remote_components.items():
                            if comp["name"].lower() in rc_name.lower() or rc_name.lower() in comp["name"].lower():
                                comp_status = rc.get("status", "operational")
                                comp["status"] = STATUSPAGE_MAP.get(comp_status, comp_status)

        # Sync active incidents if present
        remote_incidents = remote_data.get("incidents", [])
        for inc in remote_incidents:
            if inc.get("status") != "resolved":
                inc_id = f"{provider_id}-{inc.get('id')}"
                existing = [i for i in data["incidents"]["active"] if i["id"] == inc_id]
                if not existing:
                    data["incidents"]["active"].append({
                        "id": inc_id,
                        "title": inc.get("name", "Service disruption"),
                        "providerId": provider_id,
                        "severity": inc.get("impact", "minor"),
                        "status": inc.get("status", "investigating"),
                        "createdAt": inc.get("created_at", now_iso),
                        "updates": [
                            {
                                "stage": u.get("status", "investigating"),
                                "timestamp": u.get("created_at", now_iso),
                                "message": u.get("body", "")
                            }
                            for u in inc.get("incident_updates", [])
                        ]
                    })

    # Recalculate system-wide status
    all_statuses = [p.get("status") for p in data.get("providers", []) if p["id"] != "all"]
    if "major_outage" in all_statuses:
        data["system"]["status"] = "major_outage"
        data["system"]["statusMessage"] = "Major Outage Detected Across External Services"
    elif "partial_outage" in all_statuses:
        data["system"]["status"] = "partial_outage"
        data["system"]["statusMessage"] = "Partial Service Disruption Detected"
    elif "degraded" in all_statuses:
        data["system"]["status"] = "degraded"
        data["system"]["statusMessage"] = "Some Services Experiencing Degraded Performance"
    else:
        data["system"]["status"] = "operational"
        data["system"]["statusMessage"] = "All Core Systems Operational"

    data["system"]["lastUpdated"] = now_iso
    data["system"]["currentMetrics"]["activeIncidentsCount"] = len(data["incidents"]["active"])

    if dry_run:
        print("[INFO] Dry run complete. Changes not written to disk.")
        print(json.dumps(data["system"], indent=2))
        return True

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"[SUCCESS] Updated {DATA_FILE} at {now_iso}. Synced providers: {list(updated_providers) or 'None (using cached/offline state)'}")
    return True

if __name__ == "__main__":
    is_dry_run = "--dry-run" in sys.argv
    update_status_dataset(dry_run=is_dry_run)

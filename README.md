# Status Radar 🛰️

A static, modern, informative, and live-updatable status page frontend inspired by the best status dashboards across the industry:
- **[status.gemini.com](https://status.gemini.com/)** (Google Gemini & AI Studio)
- **[status.openai.com](https://status.openai.com/)** (OpenAI, ChatGPT, APIs & o1 models)
- **[status.claude.com](https://status.claude.com/)** (Anthropic Claude Platform)
- **[githubstatus.com](https://www.githubstatus.com/)** (GitHub 90-Day Uptime Strips & Components)
- **[status.hetzner.com](https://status.hetzner.com/)** (Hetzner Cloud & Datacenter Fabric)

Designed with the simplest and most intuitive UX so anyone can **plan, test, and launch** a production status page in minutes.

---

## 🌟 Key Features

- **100% Static & Resilient**: Zero server runtime requirements. Can be hosted for free on GitHub Pages, Cloudflare Pages, Netlify, Vercel, Hetzner, or AWS S3.
- **Multi-Provider Radar & Unified Overview**: Monitor Google Gemini, OpenAI, Claude, GitHub, Hetzner, and your own core platform services seamlessly from one screen.
- **GitHub-Style 90-Day Uptime Strips**: Interactive day notches with hover tooltips showing daily status, uptime percentage, and incident annotations.
- **OpenAI & Claude-Style Metric Graphs**: Lightweight interactive SVG response time charts (24h, 7d, 30d) with hover crosshairs and p50/p95 latency readouts.
- **Multi-Stage Incident Timeline**: 4-phase visual progress tracker (`Investigating` ➔ `Identified` ➔ `Monitoring` ➔ `Resolved`) with timestamps and markdown updates.
- **Scheduled Maintenance with Calendar Export**: Displays upcoming maintenance windows in the user's local timezone with one-click **Add to Calendar (.ics)** downloads.
- **Live Auto-Refresh Engine**: Continuous client-side polling with live countdown badge, pause/play toggling, and manual instant refresh.
- **Dark & Light Mode**: Seamless theme switcher with OS system preference detection (`prefers-color-scheme`).
- **Interactive Live Simulator & Planner**: In-browser floating control drawer (`⚡ Simulator & Plan`) allowing you to simulate outages, test degraded states, and export updated `status.json` with a single click.
- **Multi-Channel Subscriptions**: Ready-to-wire modals for Email, Slack webhook, Discord webhook, and standard RSS/Atom syndication (`data/feed.xml`).

---

## 🚀 Quick Start (Local Preview)

Run the zero-dependency Python server:

```bash
python3 server.py 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🔄 How Polling & Live Updates Work

Status Radar uses the **Decoupled Static Aggregator Architecture**:

```mermaid
flowchart LR
    A[Public Status APIs / Cron Worker\nOpenAI / Claude / GitHub / Hetzner] -->|sync.py every 5 mins| B[(data/status.json)]
    B -->|Static HTTP GET| C[Static Status Frontend]
    C -->|Auto-Poll Every 30s| C
    D[Live Admin Simulator] -->|In-Memory Overrides| C
```

1. **Client-Side Live Polling**:
   - The frontend automatically polls `./data/status.json` with cache-busting headers (`_t=Date.now()`) every 30 seconds.
   - When a new incident or component status is written to `data/status.json`, all open browser sessions update immediately without refreshing the page.

2. **Automated Background Polling (`scripts/sync.py`)**:
   - `scripts/sync.py` queries public Statuspage APIs (OpenAI, GitHub, Anthropic Claude) and feeds from Hetzner & Gemini, parses their statuses and active incidents, and commits the fresh payload into `data/status.json`.
   - Run manually at any time:
     ```bash
     python3 scripts/sync.py
     ```
   - Or test without writing to disk:
     ```bash
     python3 scripts/sync.py --dry-run
     ```

3. **Free Automated Deployment on GitHub Pages**:
   - Included in `.github/workflows/status-sync.yml`.
   - Runs every 5 minutes on GitHub Actions, executes `sync.py`, and automatically deploys the updated status page to GitHub Pages at $0 cost!

---

## 🛠️ How to Plan & Customize for Your Own Infrastructure

### Option 1: Use the In-Browser Live Simulator
1. Open the page and click **"⚡ Simulator & Plan"** in the bottom-right corner.
2. Select a preset scenario (e.g. *Gemini Outage*, *OpenAI Degraded*) or inject your own custom incident.
3. Click **"Download JSON"** or **"Copy status.json"**.
4. Replace `data/status.json` with your exported file!

### Option 2: Edit `data/status.json` Directly
The file structure is clean and validated by `data/schema.json`:

```json
{
  "system": {
    "name": "Your Platform Status",
    "company": "Acme Corp",
    "status": "operational",
    "statusMessage": "All Core Systems Operational"
  },
  "categories": [
    {
      "id": "api-services",
      "name": "Core API & Compute",
      "services": [
        {
          "id": "auth-service",
          "name": "Authentication & OAuth",
          "status": "operational",
          "uptime90d": 99.99
        }
      ]
    }
  ]
}
```

---

## 📁 Directory Structure

```
statuses/
├── index.html                  # Single-page semantic HTML5 entrypoint
├── favicon.svg                 # Dynamic status indicator favicon
├── server.py                   # Zero-dependency local preview server
├── css/
│   ├── styles.css              # Base tokens, dark/light themes, typography
│   ├── components.css          # Cards, 90-day bars, incident tracks, SVG charts
│   └── animations.css          # Keyframes, pulsing dot, transitions, toast
├── js/
│   ├── app.js                  # Master application bootstrapper
│   ├── state.js                # Reactive store, polling engine, simulator logic
│   ├── utils/
│   │   ├── formatters.js       # Time formatting, timezone detection, ICS calendar
│   │   └── svg-icons.js        # Feather/Lucide SVG icons
│   └── components/
│       ├── header.js           # Top nav, provider tabs, hero status banner
│       ├── metrics-summary.js  # 30-day uptime, latency, incidents count
│       ├── service-matrix.js   # Grouped services, search/filter, 90-day bars
│       ├── metrics-chart.js    # Interactive SVG response time & error rate charts
│       ├── incident-timeline.js# Active incidents & past post-mortem archive
│       ├── maintenance.js      # Scheduled windows & ICS calendar export
│       ├── subscribe-modal.js  # Email, Slack, Discord, RSS subscribe modal
│       └── admin-simulator.js  # Live status simulation drawer & JSON exporter
├── data/
│   ├── status.json             # Core status dataset
│   ├── schema.json             # JSON Schema for CI validation
│   └── feed.xml                # Static RSS incident feed
├── scripts/
│   └── sync.py                 # Background synchronizer & polling engine
└── .github/workflows/
    └── status-sync.yml         # 5-minute GitHub Actions scheduled sync
```

---

## 🚢 Deployment Options

- **usectl / Docker / PaaS (with PostgreSQL)**:
  1. Add a PostgreSQL instance in your `usectl` project.
  2. Deploy this repository using the included [`Dockerfile`](file:///Users/giorginizharadze/Documents/Projects/statuses/Dockerfile).
  3. Inject the database connection variable:
     ```bash
     DATABASE_URL=postgresql://user:password@postgres-host:5432/dbname
     ```
  4. The container automatically:
     - Connects to PostgreSQL.
     - Auto-creates the `subscribers` table if it doesn't already exist.
     - Persists all email and webhook subscriptions straight to Postgres.
     - Starts the background status polling worker every 5 minutes to keep Gemini, OpenAI, Claude, GitHub, and Hetzner statuses up to date!

- **GitHub Pages**: Push this repository to GitHub, go to *Settings ➔ Pages ➔ Source: GitHub Actions*. The included `.github/workflows/status-sync.yml` handles everything automatically.
- **Cloudflare Pages**: Connect your Git repo or run `npx wrangler pages deploy .`.
- **Vercel / Netlify**: Deploy as a static site with build command left empty and output directory set to `.`.
- **Docker Compose (Local Testing)**:
  ```bash
  docker-compose up -d
  ```
- **Hetzner / Linux VPS / Nginx**: Place files in `/var/www/status/` and configure Nginx to serve static files.

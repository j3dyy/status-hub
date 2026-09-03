/**
 * Status Radar - Reactive State Management & Live Polling Engine
 */

class StatusStateStore {
  constructor() {
    this.data = null;
    this.initialDataBackup = null;
    this.selectedProviderId = "all";
    this.searchQuery = "";
    this.statusFilter = "all"; // 'all' | 'issues' | 'operational'
    this.metricRange = "24h"; // '24h' | '7d' | '30d'
    this.isSimulated = false;
    this.isPolling = true;
    this.pollIntervalSeconds = 30;
    this.pollSecondsRemaining = 30;
    this.timerId = null;
    this.listeners = new Set();
    this.theme = this.getInitialTheme();
  }

  getInitialTheme() {
    const saved = localStorage.getItem("status_radar_theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem("status_radar_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    this.notify();
  }

  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error("Listener error:", err);
      }
    }
  }

  async init() {
    document.documentElement.setAttribute("data-theme", this.theme);
    await this.fetchLatestData(true);
    this.startPolling();
  }

  async fetchLatestData(force = false) {
    if (this.isSimulated && !force) {
      return;
    }

    try {
      const response = await fetch(`./data/status.json?_t=${Date.now()}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const freshData = await response.json();
      this.data = freshData;
      if (!this.initialDataBackup) {
        this.initialDataBackup = JSON.parse(JSON.stringify(freshData));
      }
      this.pollSecondsRemaining = this.data.system?.refreshIntervalSeconds || this.pollIntervalSeconds;
      this.notify();
    } catch (err) {
      console.warn("Could not fetch remote status, checking fallback:", err);
      if (!this.data && window.__DEFAULT_STATUS_DATA__) {
        this.data = window.__DEFAULT_STATUS_DATA__;
        this.notify();
      }
    }
  }

  startPolling() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (!this.isPolling) return;
      this.pollSecondsRemaining--;
      if (this.pollSecondsRemaining <= 0) {
        this.fetchLatestData();
        this.pollSecondsRemaining = this.pollIntervalSeconds;
      }
      this.notifyTimeTick();
    }, 1000);
  }

  notifyTimeTick() {
    const timerElem = document.getElementById("refresh-countdown");
    if (timerElem) {
      timerElem.textContent = `${this.pollSecondsRemaining}s`;
    }
  }

  setProvider(providerId) {
    this.selectedProviderId = providerId;
    this.notify();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || "").trim().toLowerCase();
    this.notify();
  }

  setStatusFilter(filter) {
    this.statusFilter = filter;
    this.notify();
  }

  setMetricRange(range) {
    this.metricRange = range;
    this.notify();
  }

  togglePolling() {
    this.isPolling = !this.isPolling;
    this.notify();
  }

  /* --------------------------------------------------------------------------
     Live Simulation / Admin Mutators
     -------------------------------------------------------------------------- */
  updateComponentStatus(serviceId, compId, newStatus) {
    this.isSimulated = true;
    if (!this.data) return;

    for (const cat of this.data.categories) {
      for (const s of cat.services) {
        if (s.id === serviceId) {
          if (compId) {
            for (const c of s.components || []) {
              if (c.id === compId) {
                c.status = newStatus;
              }
            }
          } else {
            s.status = newStatus;
            for (const c of s.components || []) {
              c.status = newStatus;
            }
          }
        }
      }
    }

    this.recomputeOverallStatus();
    this.notify();
  }

  triggerSimulatedIncident(title, providerId, severity, message) {
    this.isSimulated = true;
    if (!this.data) return;

    const newInc = {
      id: `sim-inc-${Date.now()}`,
      title: title || "Simulated Service Outage",
      providerId: providerId || "gemini",
      severity: severity || "major",
      status: "investigating",
      affectedServices: [providerId === "gemini" ? "Google Gemini API & Studio" : "Core Platform"],
      createdAt: new Date().toISOString(),
      updates: [
        {
          stage: "investigating",
          timestamp: new Date().toISOString(),
          message: message || "Engineers are actively investigating unexpected error rates on API endpoints."
        }
      ]
    };

    if (!this.data.incidents) this.data.incidents = { active: [], past: [] };
    this.data.incidents.active.unshift(newInc);

    this.recomputeOverallStatus();
    this.notify();
  }

  recomputeOverallStatus() {
    let hasMajor = false;
    let hasPartial = false;
    let hasDegraded = false;

    for (const cat of this.data.categories || []) {
      for (const s of cat.services || []) {
        if (s.status === "major_outage") hasMajor = true;
        if (s.status === "partial_outage") hasPartial = true;
        if (s.status === "degraded") hasDegraded = true;
      }
    }

    if (this.data.incidents?.active?.length > 0) {
      const highestSeverity = this.data.incidents.active[0].severity;
      if (highestSeverity === "critical" || highestSeverity === "major") hasMajor = true;
      else hasPartial = true;
    }

    if (hasMajor) {
      this.data.system.status = "major_outage";
      this.data.system.statusMessage = "Major Service Interruption Underway";
    } else if (hasPartial) {
      this.data.system.status = "partial_outage";
      this.data.system.statusMessage = "Partial Service Outage Reported";
    } else if (hasDegraded) {
      this.data.system.status = "degraded";
      this.data.system.statusMessage = "Experiencing Degraded Performance";
    } else {
      this.data.system.status = "operational";
      this.data.system.statusMessage = "All Core Systems Operational";
    }

    if (this.data.system.currentMetrics) {
      this.data.system.currentMetrics.activeIncidentsCount = this.data.incidents?.active?.length || 0;
    }
  }

  resetSimulation() {
    if (this.initialDataBackup) {
      this.data = JSON.parse(JSON.stringify(this.initialDataBackup));
    }
    this.isSimulated = false;
    this.notify();
  }

  exportJsonString() {
    return JSON.stringify(this.data, null, 2);
  }
}

export const store = new StatusStateStore();

/**
 * Status Radar - Metrics Summary Strip Component
 */

import { icons } from "../utils/svg-icons.js";

export function renderMetricsSummary(store) {
  const container = document.getElementById("metrics-summary-mount");
  if (!container) return;

  const data = store.data;
  if (!data || !data.system?.currentMetrics) {
    container.innerHTML = "";
    return;
  }

  const m = data.system.currentMetrics;
  const activeCount = data.incidents?.active?.length || 0;
  const upcomingMaintCount = data.maintenances?.length || 0;

  container.innerHTML = `
    <div class="container">
      <div class="metrics-strip">
        <div class="metric-card">
          <div class="metric-card-label">
            <span>30-Day Uptime</span>
            ${icons.checkCircle(16, "status-operational")}
          </div>
          <div class="metric-card-val" style="color: var(--status-operational)">${m.overallUptime30d || "99.98%"}</div>
          <div class="metric-card-sub">Industry target: &gt;99.9%</div>
        </div>

        <div class="metric-card">
          <div class="metric-card-label">
            <span>Avg Response Latency</span>
            ${icons.zap(16, "text-muted")}
          </div>
          <div class="metric-card-val">${m.averageLatencyMs || 142} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted)">ms</span></div>
          <div class="metric-card-sub">Global CDN & Edge p50</div>
        </div>

        <div
          class="metric-card metric-card-interactive ${activeCount > 0 ? "has-active-incidents" : ""}"
          id="metric-card-active-incidents"
          role="button"
          tabindex="0"
          title="${activeCount > 0 ? `Click to jump down to all ${activeCount} active incidents` : 'All monitored platforms operating normally'}"
        >
          <div class="metric-card-label">
            <span>Active Incidents</span>
            ${icons.alertTriangle(16, activeCount > 0 ? "status-major" : "text-muted")}
          </div>
          <div class="metric-card-val" style="${activeCount > 0 ? "color: var(--status-major)" : ""}">
            ${activeCount === 0 ? "None" : activeCount}
          </div>
          <div class="metric-card-sub" style="${activeCount > 0 ? "color: var(--status-major); font-weight: 600;" : ""}">
            ${activeCount === 0 ? "All services healthy" : `Requires attention (${activeCount}) &bull; View ↓`}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-label">
            <span>Scheduled Maintenance</span>
            ${icons.calendar(16, "text-muted")}
          </div>
          <div class="metric-card-val">${upcomingMaintCount}</div>
          <div class="metric-card-sub">Planned windows ahead</div>
        </div>
      </div>
    </div>
  `;

  // Attach Click & Keyboard Event Handlers for Active Incidents
  const incidentsCard = container.querySelector("#metric-card-active-incidents");
  const handleIncidentCardJump = () => {
    if (activeCount > 0) {
      if (store.selectedProviderId !== "all") {
        store.setProvider("all");
      }

      setTimeout(() => {
        const incidentsMount = document.getElementById("incidents-mount") || document.querySelector(".incidents-section");
        if (incidentsMount) {
          incidentsMount.scrollIntoView({ behavior: "smooth", block: "start" });
          document.querySelectorAll(".incident-card.active-outage").forEach(c => {
            c.classList.remove("card-highlight-pulse");
            void c.offsetWidth;
            c.classList.add("card-highlight-pulse");
          });
        }
      }, 100);
    }
  };

  incidentsCard?.addEventListener("click", handleIncidentCardJump);
  incidentsCard?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleIncidentCardJump();
    }
  });
}

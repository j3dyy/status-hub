/**
 * Status Radar - Incident Timeline & Stage Tracker Component
 */

import { icons } from "../utils/svg-icons.js";
import { formatDateTime, formatRelativeTime } from "../utils/formatters.js";

const STAGES = ["investigating", "identified", "monitoring", "resolved"];

function renderStageTracker(currentStage) {
  const currentIndex = STAGES.indexOf(currentStage.toLowerCase());

  return `
    <div class="incident-stages-track">
      ${STAGES.map((stage, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isPending = idx > currentIndex;

        let statusClass = isDone ? "completed" : isActive ? "active" : "pending";

        return `
          <div class="stage-step ${statusClass}">
            <span class="stage-indicator-dot"></span>
            <span style="text-transform: capitalize;">${stage}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function renderIncidents(store) {
  const container = document.getElementById("incidents-mount");
  if (!container) return;

  const data = store.data;
  if (!data || !data.incidents) {
    container.innerHTML = "";
    return;
  }

  const selectedProvider = store.selectedProviderId;
  const activeIncidents = (data.incidents.active || []).filter(inc => {
    if (selectedProvider !== "all" && inc.providerId !== selectedProvider) return false;
    return true;
  });

  const pastIncidents = (data.incidents.past || []).filter(inc => {
    if (selectedProvider !== "all" && inc.providerId !== selectedProvider) return false;
    return true;
  });

  container.innerHTML = `
    <div class="container">
      <section class="incidents-section">
        <!-- Active Incidents Banner (Highest Priority) -->
        ${activeIncidents.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--status-major);">Active System Incidents</h2>
              <span class="tab-badge" style="background: var(--status-major); color: white;">${activeIncidents.length}</span>
            </div>

            ${activeIncidents.map(inc => `
              <div class="incident-card active-outage" id="${inc.id}">
                <div class="incident-top">
                  <div class="incident-title-wrap">
                    <h3>${inc.title}</h3>
                    <div class="incident-affected-tags">
                      ${inc.providerId ? `<span class="affected-tag" style="font-weight: 600; background: var(--bg-card-subtle);">${inc.providerId.toUpperCase()}</span>` : ""}
                      ${(inc.affectedServices || []).map(s => `<span class="affected-tag">${s}</span>`).join("")}
                      <span class="affected-tag" style="background: var(--status-major-bg); color: var(--status-major); font-weight: 600; text-transform: uppercase;">
                        ${inc.severity}
                      </span>
                    </div>
                  </div>

                  <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                    Started ${formatRelativeTime(inc.createdAt)} (${formatDateTime(inc.createdAt, false)})
                  </span>
                </div>

                ${renderStageTracker(inc.status || "investigating")}

                <div class="incident-updates-list">
                  ${(inc.updates || []).map(update => `
                    <div class="incident-update-item">
                      <div class="update-meta">
                        <span class="update-stage-badge">${update.stage}</span>
                        <span class="update-time">&bull; ${formatRelativeTime(update.timestamp)}</span>
                      </div>
                      <div class="update-body">${update.message}</div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <!-- Past Incidents Archive -->
        <div class="incidents-header">
          <h2 class="incidents-title">Past Incidents &amp; Post-Mortem Log</h2>
          <span style="font-size: 0.82rem; color: var(--text-muted);">Showing resolved events from the last 90 days</span>
        </div>

        ${pastIncidents.length === 0 ? `
          <div style="padding: 32px 20px; text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);">
            No incidents reported for this provider in the last 90 days.
          </div>
        ` : pastIncidents.map(inc => `
          <article class="incident-card" id="${inc.id}">
            <div class="incident-top">
              <div class="incident-title-wrap">
                <h3>${inc.title}</h3>
                <div class="incident-affected-tags">
                  ${(inc.affectedServices || []).map(s => `<span class="affected-tag">${s}</span>`).join("")}
                  <span class="affected-tag" style="color: var(--status-operational); font-weight: 600;">Resolved</span>
                </div>
              </div>

              <span style="font-size: 0.8rem; color: var(--text-muted);">
                ${formatDateTime(inc.createdAt)}
              </span>
            </div>

            <div class="incident-updates-list">
              ${(inc.updates || []).map(update => `
                <div class="incident-update-item">
                  <div class="update-meta">
                    <span class="update-stage-badge">${update.stage}</span>
                    <span class="update-time">&bull; ${formatDateTime(update.timestamp)}</span>
                  </div>
                  <div class="update-body">${update.message}</div>
                </div>
              `).join("")}
            </div>
          </article>
        `).join("")}
      </section>
    </div>
  `;
}

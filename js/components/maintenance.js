/**
 * Status Radar - Scheduled Maintenance Component with ICS Calendar Export
 */

import { icons } from "../utils/svg-icons.js";
import { formatDateTime, formatRelativeTime, generateIcsBlob } from "../utils/formatters.js";

export function renderMaintenance(store) {
  const container = document.getElementById("maintenance-mount");
  if (!container) return;

  const data = store.data;
  if (!data || !data.maintenances || data.maintenances.length === 0) {
    container.innerHTML = "";
    return;
  }

  const selectedProvider = store.selectedProviderId;
  const maintenances = data.maintenances.filter(m => {
    if (selectedProvider !== "all" && m.providerId !== selectedProvider) return false;
    return true;
  });

  if (maintenances.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="container">
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--status-maintenance);">Scheduled Maintenance</h2>
          <span class="tab-badge" style="background: var(--status-maintenance-bg); color: var(--status-maintenance); font-weight: 600;">
            ${maintenances.length}
          </span>
        </div>

        ${maintenances.map(maint => `
          <div class="maintenance-card" id="${maint.id}">
            <div class="maintenance-header">
              <div>
                <h3 class="maintenance-title">${maint.title}</h3>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.5;">
                  ${maint.description}
                </p>

                <div class="maintenance-meta-row">
                  <span><strong>Start:</strong> ${formatDateTime(maint.scheduledStart)} (${formatRelativeTime(maint.scheduledStart)})</span>
                  <span>&bull;</span>
                  <span><strong>End:</strong> ${formatDateTime(maint.scheduledEnd)}</span>
                </div>
              </div>

              <button class="calendar-dl-btn" data-maint-id="${maint.id}" title="Download .ics event for your calendar">
                ${icons.calendar(14)}
                <span>Add to Calendar</span>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Attach .ics download triggers
  container.querySelectorAll(".calendar-dl-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-maint-id");
      const targetMaint = data.maintenances.find(m => m.id === id);
      if (targetMaint) {
        const blob = generateIcsBlob(targetMaint);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${targetMaint.id || "maintenance"}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  });
}

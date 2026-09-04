/**
 * Status Radar - Service Matrix & 90-Day Uptime Bar Strip Component
 */

import { icons } from "../utils/svg-icons.js";
import { getStatusMeta } from "../utils/formatters.js";

// Global floating tooltip element
let tooltipElem = null;

function ensureTooltip() {
  if (!tooltipElem) {
    tooltipElem = document.createElement("div");
    tooltipElem.className = "floating-tooltip";
    tooltipElem.id = "global-status-tooltip";
    document.body.appendChild(tooltipElem);
  }
  return tooltipElem;
}

/**
 * Generates 90 days of deterministic uptime data for a service
 */
function generate90DayHistory(service, pastIncidents = []) {
  const days = [];
  const today = new Date();

  // Find any incidents affecting this service
  const serviceIncidents = pastIncidents.filter(inc =>
    (inc.affectedServices || []).some(s => s.toLowerCase().includes(service.name.toLowerCase()))
  );

  // Deterministic seed based on service ID to distribute historical incident notches
  const seed = (service.id || "service").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const uptime = typeof service.uptime90d === "number" ? service.uptime90d : 99.98;
  const simulatedDegradedCount = uptime < 99.99 ? Math.min(4, Math.max(1, Math.round((100 - uptime) * 3.5))) : 0;
  
  // Pick fixed days in the past (e.g. 18 days ago, 45 days ago) based on seed
  const degradedDaysIndices = new Set();
  for (let k = 1; k <= simulatedDegradedCount; k++) {
    const dayIdx = (seed * 17 * k) % 80 + 5; // ensure it's not today (day 0) unless currently down
    degradedDaysIndices.add(dayIdx);
  }

  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Check if an explicit incident occurred on this day
    const matchInc = serviceIncidents.find(inc => inc.createdAt && inc.createdAt.startsWith(dateStr));

    let dayStatus = "operational";
    let uptimePct = 100.0;
    let incidentNote = null;

    if (matchInc) {
      dayStatus = matchInc.severity === "critical" || matchInc.severity === "major" ? "partial_outage" : "degraded";
      uptimePct = dayStatus === "partial_outage" ? 97.4 : 99.2;
      incidentNote = matchInc.title;
    } else if (i === 0 && service.status !== "operational") {
      dayStatus = service.status;
      uptimePct = dayStatus === "major_outage" ? 91.5 : 98.2;
      incidentNote = "Active disruption reported today";
    } else if (degradedDaysIndices.has(i) && service.uptime90d < 100.0) {
      // Historical degradation notch matching reported uptime
      dayStatus = (seed + i) % 3 === 0 ? "partial_outage" : "degraded";
      uptimePct = dayStatus === "partial_outage" ? 96.8 : 98.9;
      incidentNote = `Elevated error rate and latency on ${service.name}`;
    }

    days.push({
      dateStr,
      displayDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      status: dayStatus,
      uptimePct,
      incidentNote
    });
  }

  return days;
}

export function renderServiceMatrix(store) {
  const container = document.getElementById("services-mount");
  if (!container) return;

  const data = store.data;
  if (!data || !data.categories) {
    container.innerHTML = `<div class="skeleton-matrix"></div>`;
    return;
  }

  const tooltip = ensureTooltip();
  const pastIncidents = data.incidents?.past || [];
  const selectedProvider = store.selectedProviderId;
  const query = store.searchQuery;
  const statusFilter = store.statusFilter;

  // Filter Categories and Services
  const filteredCategories = data.categories
    .map(cat => {
      const filteredServices = cat.services.filter(service => {
        // Filter by provider tab
        if (selectedProvider !== "all" && service.providerId !== selectedProvider) {
          return false;
        }

        // Filter by status dropdown
        if (statusFilter === "issues" && service.status === "operational") {
          return false;
        }
        if (statusFilter === "operational" && service.status !== "operational") {
          return false;
        }

        // Filter by search query
        if (query) {
          const matchName = service.name.toLowerCase().includes(query);
          const matchDesc = (service.description || "").toLowerCase().includes(query);
          const matchComp = (service.components || []).some(c => c.name.toLowerCase().includes(query));
          if (!matchName && !matchDesc && !matchComp) {
            return false;
          }
        }

        return true;
      });
      return {
        ...cat,
        services: filteredServices
      };
    })
    .filter(cat => cat.services.length > 0);

  const activeId = document.activeElement ? document.activeElement.id : null;
  const selStart = document.activeElement?.selectionStart;
  const selEnd = document.activeElement?.selectionEnd;

  container.innerHTML = `
    <div class="container">
      <!-- Search & Filter Controls -->
      <div class="search-filter-bar">
        <div class="search-box-wrap">
          <span class="search-box-icon">${icons.search(16)}</span>
          <input
            type="search"
            class="search-box-input"
            id="service-search-input"
            placeholder="Filter components by name or keyword..."
            value="${store.searchQuery}"
            aria-label="Search components"
          />
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <select class="filter-select" id="service-status-filter" aria-label="Filter by status">
            <option value="all" ${statusFilter === "all" ? "selected" : ""}>All Component States</option>
            <option value="issues" ${statusFilter === "issues" ? "selected" : ""}>Disruptions Only (!)</option>
            <option value="operational" ${statusFilter === "operational" ? "selected" : ""}>Operational Only</option>
          </select>
        </div>
      </div>

      <!-- Categories & Services List -->
      ${
        filteredCategories.length === 0
          ? `
            <div style="text-align: center; padding: 48px 24px; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);">
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px; color: var(--text-primary)">No matching components found</p>
              <p style="font-size: 0.88rem;">Try clearing your search query or switching provider tabs above.</p>
            </div>
          `
          : filteredCategories.map(cat => `
            <div class="category-group" id="cat-${cat.id}">
              <div class="category-header">
                <h2 class="category-title">
                  <span>${cat.name}</span>
                  <span style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted); background: var(--bg-card-subtle); padding: 2px 8px; border-radius: var(--radius-full);">${cat.services.length} services</span>
                </h2>
                <span class="category-desc">${cat.description || ""}</span>
              </div>

              <div class="services-list">
                ${cat.services.map(service => {
                  const sMeta = getStatusMeta(service.status);
                  const historyDays = generate90DayHistory(service, pastIncidents);
                  const providerObj = data.providers?.find(p => p.id === service.providerId);
                  const hasSubcomps = service.components && service.components.length > 0;

                  return `
                    <div class="service-card" data-service-id="${service.id}">
                      <!-- Service Card Header -->
                      <div class="service-header" data-action="toggle-accordion">
                        <div class="service-identity">
                          ${hasSubcomps ? `<span class="service-toggle-icon">${icons.chevronDown(16)}</span>` : ""}
                          <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <span class="service-name">${service.name}</span>
                              ${providerObj ? `<span class="service-provider-pill">${providerObj.name}</span>` : ""}
                            </div>
                            ${service.description ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${service.description}</p>` : ""}
                          </div>
                        </div>

                        <div class="service-status-wrap">
                          ${service.currentLatencyMs ? `
                            <span style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                              ${icons.zap(13)} ${service.currentLatencyMs}ms
                            </span>
                          ` : ""}
                          <span class="status-pill ${sMeta.class}">
                            ${icons[sMeta.icon](13)}
                            <span>${sMeta.label}</span>
                          </span>
                        </div>
                      </div>

                      <!-- 90-Day Uptime Bar Strip (GitHub Status Style) -->
                      <div class="uptime-strip-container">
                        <div class="uptime-bars-wrapper" aria-label="90-day uptime history for ${service.name}">
                          ${historyDays.map(day => `
                            <div
                              class="uptime-day-bar ${day.status !== "operational" ? day.status : ""}"
                              data-date="${day.displayDate}"
                              data-status="${day.status}"
                              data-uptime="${day.uptimePct}%"
                              data-incident="${day.incidentNote || ""}"
                            ></div>
                          `).join("")}
                        </div>

                        <div class="uptime-strip-labels">
                          <span>90 days ago</span>
                          <span class="uptime-percentage-val">${service.uptime90d || 99.98}% uptime</span>
                          <span>Today</span>
                        </div>
                      </div>

                      <!-- Subcomponents List (Expandable) -->
                      ${hasSubcomps ? `
                        <div class="subcomponents-panel">
                          ${service.components.map(comp => {
                            const cMeta = getStatusMeta(comp.status);
                            return `
                              <div class="subcomponent-item">
                                <span class="subcomponent-name">
                                  <span>&bull;</span>
                                  <span>${comp.name}</span>
                                </span>
                                <span class="subcomponent-status ${cMeta.class}" style="color: var(--status-${cMeta.class === 'operational' ? 'operational' : cMeta.class})">
                                  ${icons[cMeta.icon](14)}
                                  <span>${cMeta.label}</span>
                                </span>
                              </div>
                            `;
                          }).join("")}
                        </div>
                      ` : ""}
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `).join("")
      }
    </div>
  `;

  // Attach search & filter listeners
  const searchInput = document.getElementById("service-search-input");
  searchInput?.addEventListener("input", (e) => {
    store.setSearchQuery(e.target.value);
  });

  if (activeId === "service-search-input" && searchInput) {
    searchInput.focus();
    if (typeof selStart === "number" && typeof selEnd === "number") {
      try { searchInput.setSelectionRange(selStart, selEnd); } catch (_) {}
    }
  }

  const filterSelect = document.getElementById("service-status-filter");
  filterSelect?.addEventListener("change", (e) => {
    store.setStatusFilter(e.target.value);
  });

  // Attach Accordion Toggle
  container.querySelectorAll('[data-action="toggle-accordion"]').forEach(header => {
    header.addEventListener("click", () => {
      const card = header.closest(".service-card");
      if (card) {
        card.classList.toggle("expanded");
      }
    });
  });

  // Attach Tooltip events to 90-day bars
  container.querySelectorAll(".uptime-day-bar").forEach(bar => {
    bar.addEventListener("mouseenter", (e) => {
      const date = bar.getAttribute("data-date");
      const status = bar.getAttribute("data-status");
      const uptime = bar.getAttribute("data-uptime");
      const incident = bar.getAttribute("data-incident");

      let html = `<strong>${date}</strong><br/>Uptime: ${uptime} &bull; ${status.replace("_", " ")}`;
      if (incident) {
        html += `<br/><span style="color: #f87171;">Disruption: ${incident}</span>`;
      }

      tooltip.innerHTML = html;
      tooltip.style.display = "block";

      const rect = bar.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top}px`;
    });

    bar.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

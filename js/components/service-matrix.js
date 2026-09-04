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

  const activeIncidents = data.incidents?.active || [];

  function getServiceSeverityScore(service) {
    // 4: major_outage, 3: partial_outage, 2: degraded
    // 1: has active incident or non-operational subcomponent
    // 0: fully operational
    const hasActiveInc = activeIncidents.some(i => i.providerId === service.providerId);
    const hasDegradedComp = (service.components || []).some(c => c.status !== "operational");

    if (service.status === "major_outage") return 4;
    if (service.status === "partial_outage") return 3;
    if (service.status === "degraded") return 2;
    if (hasActiveInc || hasDegradedComp) return 1;
    return 0;
  }

  // Filter Categories and Services, placing degrading services with badges first
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

      // Sort services: degrading services with badges appear first
      const sortedServices = [...filteredServices].sort((a, b) => {
        const scoreA = getServiceSeverityScore(a);
        const scoreB = getServiceSeverityScore(b);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return 0;
      });

      const maxSeverity = sortedServices.length > 0 ? getServiceSeverityScore(sortedServices[0]) : 0;

      return {
        ...cat,
        maxSeverity,
        services: sortedServices
      };
    })
    .filter(cat => cat.services.length > 0)
    .sort((a, b) => {
      // Elevate categories with disruptions or degraded services to the top
      if (a.maxSeverity !== b.maxSeverity) {
        return b.maxSeverity - a.maxSeverity;
      }
      return 0;
    });

  container.innerHTML = `
    <div class="container">
      <!-- Categories & Services List -->
      ${
        filteredCategories.length === 0
          ? `
            <div style="text-align: center; padding: 48px 24px; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);">
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px; color: var(--text-primary)">No matching components found</p>
              <p style="font-size: 0.88rem;">Try switching provider tabs above.</p>
            </div>
          `
          : filteredCategories.map(cat => `
            <div class="category-group" id="cat-${cat.id}">
              <div class="category-header">
                <h2 class="category-title">
                  <span>${cat.name}</span>
                  <span style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted); background: var(--bg-card-subtle); padding: 2px 8px; border-radius: var(--radius-full);">${cat.services.length} ${cat.services.length === 1 ? "service" : "services"}</span>
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

  // Attach Accordion Toggle
  container.querySelectorAll('[data-action="toggle-accordion"]').forEach(header => {
    header.addEventListener("click", () => {
      const card = header.closest(".service-card");
      if (card) {
        card.classList.toggle("expanded");
      }
    });
  });

  // Helper to position and display tooltip safely
  function showBarTooltip(bar) {
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
    const rawX = rect.left + rect.width / 2;
    // Keep tooltip inside screen boundaries on mobile
    const tooltipWidth = tooltip.offsetWidth || 160;
    const halfWidth = tooltipWidth / 2 + 10;
    const clampedX = Math.max(halfWidth, Math.min(window.innerWidth - halfWidth, rawX));

    tooltip.style.left = `${clampedX}px`;
    tooltip.style.top = `${rect.top}px`;
  }

  function hideBarTooltip() {
    tooltip.style.display = "none";
    container.querySelectorAll(".uptime-day-bar.active-touch").forEach(b => b.classList.remove("active-touch"));
  }

  // Attach Mouse Tooltip events
  container.querySelectorAll(".uptime-day-bar").forEach(bar => {
    bar.addEventListener("mouseenter", () => showBarTooltip(bar));
    bar.addEventListener("mouseleave", hideBarTooltip);
  });

  // Attach Touch events for mobile scrubbing
  let touchDismissTimer = null;
  container.querySelectorAll(".uptime-bars-wrapper").forEach(wrapper => {
    const handleTouch = (e) => {
      if (touchDismissTimer) clearTimeout(touchDismissTimer);
      const touch = e.touches[0];
      if (!touch) return;

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const bar = target?.closest(".uptime-day-bar");
      if (bar && wrapper.contains(bar)) {
        wrapper.querySelectorAll(".uptime-day-bar.active-touch").forEach(b => {
          if (b !== bar) b.classList.remove("active-touch");
        });
        bar.classList.add("active-touch");
        showBarTooltip(bar);
      }
    };

    wrapper.addEventListener("touchstart", handleTouch, { passive: true });
    wrapper.addEventListener("touchmove", handleTouch, { passive: true });
    wrapper.addEventListener("touchend", () => {
      touchDismissTimer = setTimeout(hideBarTooltip, 1800);
    });
    wrapper.addEventListener("touchcancel", hideBarTooltip);
  });
}

/**
 * Status Radar - Header & Navigation Component
 * Features futuristic animated radar logo and zero-scroll above-the-fold outage ticker.
 */

import { icons } from "../utils/svg-icons.js";
import { getStatusMeta, formatDateTime } from "../utils/formatters.js";

// Custom Futuristic SVG Radar Logo
const RADAR_LOGO_SVG = `
  <svg width="34" height="34" viewBox="0 0 48 48" fill="none" class="brand-radar-svg">
    <defs>
      <linearGradient id="navRadarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.9" />
        <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.0" />
      </linearGradient>
      <radialGradient id="navRadarCenter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="60%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </radialGradient>
      <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="24" cy="24" r="22" stroke="#3b82f6" stroke-width="1.8" stroke-dasharray="3 3" opacity="0.4" />
    <circle cx="24" cy="24" r="15" stroke="#3b82f6" stroke-width="1.6" opacity="0.6" />
    <circle cx="24" cy="24" r="8" stroke="#60a5fa" stroke-width="1.4" opacity="0.8" />
    <line x1="24" y1="2" x2="24" y2="46" stroke="#3b82f6" stroke-width="1" opacity="0.25" />
    <line x1="2" y1="24" x2="46" y2="24" stroke="#3b82f6" stroke-width="1" opacity="0.25" />
    <path d="M 24 24 L 40 8 A 22 22 0 0 1 46 24 Z" fill="url(#navRadarSweep)" />
    <circle cx="35" cy="15" r="3.2" fill="#10b981" filter="url(#navGlow)" />
    <circle cx="14" cy="32" r="2.2" fill="#38bdf8" opacity="0.9" />
    <circle cx="24" cy="24" r="4.5" fill="url(#navRadarCenter)" stroke="#ffffff" stroke-width="1.5" filter="url(#navGlow)" />
  </svg>
`;

export function renderHeader(store) {
  const container = document.getElementById("header-mount");
  if (!container) return;

  const data = store.data;
  if (!data) {
    container.innerHTML = `<div class="skeleton-header"></div>`;
    return;
  }

  const system = data.system;
  const providers = data.providers || [];
  const statusMeta = getStatusMeta(system.status);
  const isDark = store.theme === "dark";

  // Scan for any impacted services or subcomponents (ABOVE THE FOLD VISIBILITY)
  const impactedItems = [];
  for (const cat of data.categories || []) {
    for (const s of cat.services || []) {
      const providerObj = providers.find(p => p.id === s.providerId);
      const providerName = providerObj ? providerObj.name : "";

      if (s.status !== "operational") {
        const sMeta = getStatusMeta(s.status);
        impactedItems.push({
          id: s.id,
          name: s.name,
          providerName,
          providerId: s.providerId,
          status: s.status,
          statusLabel: sMeta.label,
          type: "service"
        });
      }

      // Check subcomponents
      for (const comp of s.components || []) {
        if (comp.status !== "operational" && s.status === "operational") {
          const cMeta = getStatusMeta(comp.status);
          impactedItems.push({
            id: s.id,
            name: `${comp.name} (${s.name})`,
            providerName,
            providerId: s.providerId,
            status: comp.status,
            statusLabel: cMeta.label,
            type: "subcomponent"
          });
        }
      }
    }
  }

  container.innerHTML = `
    <!-- Top Site Nav -->
    <header class="site-header">
      <div class="container site-header-inner">
        <div class="brand-group">
          <div class="brand-logo-wrap" title="isdown" style="display: flex; align-items: center; justify-content: center;">
            ${RADAR_LOGO_SVG}
          </div>
          <div class="brand-text">
            <span class="brand-title" style="font-size: 1.35rem; letter-spacing: -0.035em; font-weight: 850;">isdown</span>
            <span class="brand-subtitle">Real-time AI &amp; Cloud Status</span>
          </div>
        </div>

        <div class="header-actions">
          <button class="action-btn" id="open-subscribe-modal" title="Subscribe to incident alerts">
            ${icons.bell(16)}
            <span>Subscribe</span>
          </button>
          <button class="icon-btn" id="theme-toggle-btn" title="Toggle Light/Dark Theme" aria-label="Toggle theme">
            ${isDark ? icons.sun(18) : icons.moon(18)}
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Status Section & Provider Switcher -->
    <div class="container" style="padding-top: 24px;">
      <!-- Provider Tabs Bar -->
      <nav class="provider-nav-wrap" aria-label="Provider selection">
        <div class="provider-tabs">
          ${providers.map(p => {
    const isActive = store.selectedProviderId === p.id;
    const iconSvg = icons[p.icon] ? icons[p.icon](16) : icons.layers(16);
    return `
              <button class="provider-tab ${isActive ? "active" : ""}" data-provider-id="${p.id}">
                ${iconSvg}
                <span>${p.name}</span>
                ${p.status && p.status !== "operational" ? `<span class="tab-badge" style="background: var(--status-major); color: white;">!</span>` : ""}
              </button>
            `;
  }).join("")}
        </div>
      </nav>

      <!-- Global Status Hero Banner -->
      <section class="status-hero ${statusMeta.class}">
        <div class="status-hero-top-row">
          <div class="status-hero-main">
            <div class="status-indicator-huge" aria-hidden="true">
              ${icons[statusMeta.icon](28)}
            </div>
            <div class="status-hero-text">
              <h1>${system.statusMessage || statusMeta.label}</h1>
              <p>
                ${statusMeta.description} &bull; Last verified ${formatDateTime(system.lastUpdated)}
              </p>
            </div>
          </div>

          
          <div class="status-hero-meta">
            <div class="live-badge">
              <span class="live-dot" title="Live status active"></span>
              <span>Live Radar</span>
            </div>

            <div class="refresh-chip" id="manual-refresh-trigger" title="Click to refresh immediately">
              <span id="refresh-icon-wrap">${icons.refresh(14)}</span>
              <span>Next check in <strong id="refresh-countdown">${store.pollSecondsRemaining}s</strong></span>
            </div>
          </div>
        </div>

        <!-- ===================================================================
             ZERO-SCROLL RADAR: Instantly see what is down before scrolling!
             =================================================================== -->
        <div class="above-fold-radar">
          ${impactedItems.length > 0 ? `
            <div class="above-fold-disruptions">
              <div class="disruption-alert-heading">
                <span>⚠️</span>
                <span>Active Disruptions Detected Before Scroll (${impactedItems.length}):</span>
              </div>
              <div class="disruption-chips-row">
                ${impactedItems.map(item => `
                  <button class="disruption-pill ${item.status}" data-jump-service="${item.id}" title="Click to scroll down to ${item.name}">
                    <span class="pill-dot"></span>
                    <span><strong>${item.providerName ? item.providerName + ": " : ""}${item.name}</strong> &bull; ${item.statusLabel}</span>
                    <span class="jump-arrow">↓</span>
                  </button>
                `).join("")}
              </div>
            </div>
          ` : `
            <div class="above-fold-glance">
              <div class="glance-left">
                <span class="glance-label">ISDOWN RADAR:</span>
                <div class="glance-pills-row">
                  ${providers.filter(p => p.id !== "all").map(p => `
                    <button class="glance-pill" data-jump-provider="${p.id}" title="Filter by ${p.name}">
                      <span class="glance-dot operational"></span>
                      <span>${p.name}</span>
                    </button>
                  `).join("")}
                </div>
              </div>
              <div class="glance-status-tag">
                ${icons.checkCircle(14, "status-operational")}
                <span>All ${providers.filter(p => p.id !== "all").length} Providers Operational</span>
              </div>
            </div>
          `}
        </div>
      </section>
    </div>
  `;

  // Attach Event Listeners
  document.getElementById("theme-toggle-btn")?.addEventListener("click", () => {
    store.toggleTheme();
  });

  document.getElementById("manual-refresh-trigger")?.addEventListener("click", async () => {
    const iconWrap = document.getElementById("refresh-icon-wrap");
    if (iconWrap) iconWrap.classList.add("spinning");
    await store.fetchLatestData(true);
    setTimeout(() => {
      if (iconWrap) iconWrap.classList.remove("spinning");
    }, 600);
  });

  const providerBtns = container.querySelectorAll(".provider-tab, .glance-pill");
  providerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = btn.getAttribute("data-provider-id") || btn.getAttribute("data-jump-provider");
      if (pId) store.setProvider(pId);
    });
  });

  // Attach Jump-To-Service Handlers for Disruption Pills
  container.querySelectorAll("[data-jump-service]").forEach(pill => {
    pill.addEventListener("click", () => {
      const serviceId = pill.getAttribute("data-jump-service");
      const targetCard = document.querySelector(`[data-service-id="${serviceId}"]`);
      if (targetCard) {
        // Expand card accordion if collapsed
        targetCard.classList.add("expanded");
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

        // Trigger flash highlight
        targetCard.classList.remove("card-highlight-pulse");
        void targetCard.offsetWidth; // Force reflow
        targetCard.classList.add("card-highlight-pulse");
      }
    });
  });
}

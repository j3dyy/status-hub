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

let isGlobalKeydownBound = false;

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

  // Scan for active incidents & disruptions (ABOVE THE FOLD ZERO-SCROLL VISIBILITY)
  const impactedItems = [];
  const activeIncidents = data.incidents?.active || [];

  // First priority: Active incidents (specific & actionable)
  for (const inc of activeIncidents) {
    const providerObj = providers.find(p => p.id === inc.providerId);
    const providerName = providerObj ? providerObj.name : inc.providerId;
    const severityStatus = (inc.severity === "critical" || inc.severity === "major")
      ? "major_outage"
      : "degraded";

    impactedItems.push({
      id: inc.id,
      name: inc.title,
      providerName,
      providerId: inc.providerId,
      status: severityStatus,
      statusLabel: inc.severity ? inc.severity : "disruption",
      type: "incident"
    });
  }

  // Second priority: Non-operational services without an explicit active incident
  for (const cat of data.categories || []) {
    for (const s of cat.services || []) {
      const providerObj = providers.find(p => p.id === s.providerId);
      const providerName = providerObj ? providerObj.name : "";

      const hasActiveIncident = activeIncidents.some(i => i.providerId === s.providerId);

      if (s.status !== "operational" && !hasActiveIncident) {
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
        if (comp.status !== "operational" && s.status === "operational" && !hasActiveIncident) {
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

  // Count operational vs impacted providers
  const nonAllProviders = providers.filter(p => p.id !== "all");
  const impactedProviderIds = new Set([
    ...impactedItems.map(item => item.providerId),
    ...nonAllProviders.filter(p => p.status && p.status !== "operational").map(p => p.id)
  ]);
  const operationalCount = nonAllProviders.length - impactedProviderIds.size;

  // Render or preserve static site-header to maintain input focus & cursor position
  let searchInputElem = container.querySelector("#topbar-search-input");
  let heroWrap = container.querySelector(".hero-container-wrap");

  if (!searchInputElem) {
    container.innerHTML = `
      <!-- Top Site Nav with Center Search Filter -->
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

          <!-- Topbar Quick Filter Search Input -->
          <div class="header-search-container">
            <div class="header-search-box">
              <span class="header-search-icon">${icons.search(15)}</span>
              <input
                type="search"
                id="topbar-search-input"
                class="topbar-search-input"
                placeholder="Filter services &amp; cloud status... (Press /)"
                value="${store.searchQuery || ""}"
                aria-label="Filter services &amp; cloud status"
                autocomplete="off"
                spellcheck="false"
              />
              <button class="header-search-clear" id="topbar-search-clear" title="Clear filter" style="display: ${store.searchQuery ? "flex" : "none"};">
                ${icons.x(14)}
              </button>
              <kbd class="header-search-shortcut" id="topbar-search-shortcut" style="display: ${store.searchQuery ? "none" : "inline-block"};">/</kbd>
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

      <!-- Hero Status Section & Provider Switcher Mount Point -->
      <div class="container hero-container-wrap" style="padding-top: 24px;"></div>
    `;

    // Attach Topbar Search Event Listeners
    const topbarInput = document.getElementById("topbar-search-input");
    const clearBtn = document.getElementById("topbar-search-clear");
    const shortcutKbd = document.getElementById("topbar-search-shortcut");

    topbarInput?.addEventListener("input", (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? "flex" : "none";
      if (shortcutKbd) shortcutKbd.style.display = val ? "none" : "inline-block";
      store.setSearchQuery(val);
    });

    clearBtn?.addEventListener("click", () => {
      if (topbarInput) {
        topbarInput.value = "";
        topbarInput.focus();
      }
      if (clearBtn) clearBtn.style.display = "none";
      if (shortcutKbd) shortcutKbd.style.display = "inline-block";
      store.setSearchQuery("");
    });

    // Global keyboard shortcut
    if (!isGlobalKeydownBound) {
      window.addEventListener("keydown", (e) => {
        const input = document.getElementById("topbar-search-input");
        if (
          (e.key === "/" && document.activeElement !== input && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) ||
          ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
        ) {
          e.preventDefault();
          input?.focus();
          input?.select();
        }
        if (e.key === "Escape" && document.activeElement === input) {
          input?.blur();
        }
      });
      isGlobalKeydownBound = true;
    }

    document.getElementById("theme-toggle-btn")?.addEventListener("click", () => {
      store.toggleTheme();
    });

    heroWrap = container.querySelector(".hero-container-wrap");
  } else {
    // Keep topbar input value and theme button synced without destroying DOM
    const topbarInput = document.getElementById("topbar-search-input");
    const clearBtn = document.getElementById("topbar-search-clear");
    const shortcutKbd = document.getElementById("topbar-search-shortcut");
    const themeBtn = document.getElementById("theme-toggle-btn");

    if (topbarInput && topbarInput !== document.activeElement && topbarInput.value !== store.searchQuery) {
      topbarInput.value = store.searchQuery || "";
    }
    if (clearBtn) clearBtn.style.display = store.searchQuery ? "flex" : "none";
    if (shortcutKbd) shortcutKbd.style.display = store.searchQuery ? "none" : "inline-block";
    if (themeBtn) themeBtn.innerHTML = isDark ? icons.sun(18) : icons.moon(18);
  }

  // Sort providers: "all" first, then any degrading providers with badges, then healthy providers
  const sortedProviders = [...providers].sort((a, b) => {
    if (a.id === "all") return -1;
    if (b.id === "all") return 1;
    const aImpacted = impactedProviderIds.has(a.id);
    const bImpacted = impactedProviderIds.has(b.id);
    if (aImpacted && !bImpacted) return -1;
    if (!aImpacted && bImpacted) return 1;
    return 0;
  });

  const sortedNonAllProviders = [...nonAllProviders].sort((a, b) => {
    const aImpacted = impactedProviderIds.has(a.id);
    const bImpacted = impactedProviderIds.has(b.id);
    if (aImpacted && !bImpacted) return -1;
    if (!aImpacted && bImpacted) return 1;
    return 0;
  });

  // Update Hero & Provider Tabs
  if (heroWrap) {
    heroWrap.innerHTML = `
      <!-- Provider Tabs Bar -->
      <nav class="provider-nav-wrap" aria-label="Provider selection">
        <div class="provider-tabs">
          ${sortedProviders.map(p => {
            const isActive = store.selectedProviderId === p.id;
            const iconSvg = icons[p.icon] ? icons[p.icon](16) : icons.layers(16);
            const isImpacted = impactedProviderIds.has(p.id);
            return `
              <button class="provider-tab ${isActive ? "active" : ""} ${isImpacted ? "has-disruption" : ""}" data-provider-id="${p.id}">
                ${iconSvg}
                <span>${p.name}</span>
                ${isImpacted ? `<span class="tab-badge" style="background: var(--status-major); color: white; font-weight: 700;">!</span>` : ""}
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
             ZERO-SCROLL RADAR: Both Active Disruptions & All-Platform Health
             =================================================================== -->
        <div class="above-fold-radar">
          ${impactedItems.length > 0 ? `
            <!-- Active Disruptions Row (Top Priority) -->
            <div class="above-fold-disruptions">
              <div class="disruption-alert-heading">
                <span>⚠️</span>
                <span>Active Disruptions Detected Before Scroll (${impactedItems.length}):</span>
              </div>
              <div class="disruption-chips-row">
                ${impactedItems.map(item => `
                  <button class="disruption-pill ${item.status}" data-jump-target="${item.id}" title="Click to jump directly to ${item.name}">
                    <span class="pill-dot"></span>
                    <span><strong>${item.providerName ? item.providerName + ": " : ""}${item.name}</strong> &bull; ${item.statusLabel}</span>
                    <span class="jump-arrow">↓</span>
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Multi-Cloud & AI Infrastructure At-A-Glance (Always Visible) -->
          <div class="above-fold-glance ${impactedItems.length > 0 ? "has-disruptions" : ""}">
            <div class="glance-left">
              <span class="glance-label">
                ${icons.layers ? icons.layers(14) : "🌐"} ALL PLATFORMS:
              </span>
              <div class="glance-pills-row">
                ${sortedNonAllProviders.map(p => {
                  const isImpacted = impactedProviderIds.has(p.id);
                  const isTabActive = store.selectedProviderId === p.id;
                  const dotClass = isImpacted ? (p.status === "major_outage" ? "major_outage" : "degraded") : "operational";
                  return `
                    <button class="glance-pill ${isImpacted ? "impacted" : ""} ${isTabActive ? "selected" : ""}" data-jump-provider="${p.id}" title="Filter to ${p.name} (${isImpacted ? "Disruptions reported" : "Operational"})">
                      <span class="glance-dot ${dotClass}"></span>
                      <span>${p.name}</span>
                      ${isImpacted ? `<span class="glance-alert-indicator">!</span>` : ""}
                    </button>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="glance-status-tag ${impactedItems.length > 0 ? "warning" : "ok"}">
              ${impactedItems.length > 0
                ? `${icons.alertTriangle(14, "status-major")} <span>${impactedItems.length} active disruptions &bull; ${operationalCount} platforms healthy</span>`
                : `${icons.checkCircle(14, "status-operational")} <span>All ${nonAllProviders.length} Providers Operational</span>`
              }
            </div>
          </div>
        </div>
      </section>
    `;

    // Attach Provider Switcher & Glance Listeners
    heroWrap.querySelectorAll(".provider-tab, .glance-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-provider-id") || btn.getAttribute("data-jump-provider");
        if (pId) store.setProvider(pId);
      });
    });

    // Attach Manual Refresh
    document.getElementById("manual-refresh-trigger")?.addEventListener("click", async () => {
      const iconWrap = document.getElementById("refresh-icon-wrap");
      if (iconWrap) iconWrap.classList.add("spinning");
      await store.fetchLatestData(true);
      setTimeout(() => {
        if (iconWrap) iconWrap.classList.remove("spinning");
      }, 600);
    });

    // Attach Jump Handlers for Disruption Pills
    heroWrap.querySelectorAll("[data-jump-target]").forEach(pill => {
      pill.addEventListener("click", () => {
        const targetId = pill.getAttribute("data-jump-target");
        // Check for incident card by ID
        let targetElem = document.getElementById(targetId);
        // Or check for service card by data-service-id
        if (!targetElem) {
          targetElem = document.querySelector(`[data-service-id="${targetId}"]`);
        }

        // If filtered out, reset provider to "all" to expose element
        if (!targetElem && store.selectedProviderId !== "all") {
          store.setProvider("all");
          setTimeout(() => {
            const freshTarget = document.getElementById(targetId) || document.querySelector(`[data-service-id="${targetId}"]`);
            if (freshTarget) {
              if (freshTarget.classList.contains("service-card")) freshTarget.classList.add("expanded");
              freshTarget.scrollIntoView({ behavior: "smooth", block: "center" });
              freshTarget.classList.remove("card-highlight-pulse");
              void freshTarget.offsetWidth;
              freshTarget.classList.add("card-highlight-pulse");
            }
          }, 100);
          return;
        }

        if (targetElem) {
          if (targetElem.classList.contains("service-card")) {
            targetElem.classList.add("expanded");
          }
          targetElem.scrollIntoView({ behavior: "smooth", block: "center" });
          targetElem.classList.remove("card-highlight-pulse");
          void targetElem.offsetWidth;
          targetElem.classList.add("card-highlight-pulse");
        }
      });
    });
  }
}

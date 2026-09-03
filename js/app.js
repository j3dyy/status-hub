/**
 * Status Radar - Main Application Entrypoint
 */

import { store } from "./state.js";
import { renderHeader } from "./components/header.js";
import { renderMetricsSummary } from "./components/metrics-summary.js";
import { renderServiceMatrix } from "./components/service-matrix.js";
import { renderMetricsChart } from "./components/metrics-chart.js";
import { renderIncidents } from "./components/incident-timeline.js";
import { renderMaintenance } from "./components/maintenance.js";
import { initSubscribeModal } from "./components/subscribe-modal.js";
import { initAdminSimulator } from "./components/admin-simulator.js";

function updateFavicon(status) {
  let favicon = document.querySelector("link[rel='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    document.head.appendChild(favicon);
  }

  const colors = {
    operational: "#10b981",
    degraded: "#f59e0b",
    partial_outage: "#f97316",
    major_outage: "#ef4444",
    maintenance: "#0ea5e9"
  };
  const color = colors[status] || "#10b981";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="${color}" />
    <circle cx="16" cy="16" r="6" fill="#ffffff" />
  </svg>`;

  favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function renderAll(currentStore) {
  renderHeader(currentStore);
  renderMetricsSummary(currentStore);
  renderMaintenance(currentStore);
  renderMetricsChart(currentStore);
  renderServiceMatrix(currentStore);
  renderIncidents(currentStore);

  if (currentStore.data?.system?.status) {
    updateFavicon(currentStore.data.system.status);
    document.title = `${currentStore.data.system.statusMessage || "Operational"} - ${currentStore.data.system.name}`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Subscribe UI renderer to reactive store changes
  store.subscribe(renderAll);

  // Initialize modals and simulator
  initSubscribeModal();
  initAdminSimulator(store);

  // Boot application
  await store.init();
});

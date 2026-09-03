/**
 * Status Radar - Live Simulator & Planning Drawer Component
 * Allows users to test degraded states, simulate outages, and export status.json for production deployment.
 */

import { icons } from "../utils/svg-icons.js";

export function initAdminSimulator(store) {
  let simMount = document.getElementById("simulator-mount");
  if (!simMount) {
    simMount = document.createElement("div");
    simMount.id = "simulator-mount";
    document.body.appendChild(simMount);
  }

  simMount.innerHTML = `
    <!-- Floating Trigger -->
    <div class="simulator-drawer">
      <button class="simulator-toggle-btn" id="toggle-simulator-btn" title="Open Live Simulator & Planning Tools">
        ${icons.zap(16)}
        <span>Simulator &amp; Plan</span>
        <span id="sim-active-indicator" style="display: none; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span>
      </button>

      <!-- Simulator Drawer Panel -->
      <div class="simulator-panel" id="simulator-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${icons.zap(18, "text-primary")}
            <h3 style="font-size: 1rem; font-weight: 700;">Live Simulator &amp; Planner</h3>
          </div>
          <button class="icon-btn" id="close-simulator-btn" aria-label="Close simulator" style="width: 28px; height: 28px;">
            ${icons.x(14)}
          </button>
        </div>

        <!-- Mode Indicator -->
        <div id="sim-status-banner" style="display: none; padding: 8px 12px; border-radius: var(--radius-sm); background: var(--status-degraded-bg); border: 1px solid var(--status-degraded-border); font-size: 0.78rem; margin-bottom: 14px; color: var(--text-primary);">
          <strong>Simulation Active:</strong> Real-time in-memory state overrides enabled.
        </div>

        <!-- Section 1: Quick Scenario Presets -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">
            Quick Scenarios
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button class="action-btn" id="sim-scenario-gemini-outage" style="font-size: 0.76rem; justify-content: center;">
              💥 Gemini Outage
            </button>
            <button class="action-btn" id="sim-scenario-openai-degraded" style="font-size: 0.76rem; justify-content: center;">
              ⚠️ OpenAI Degraded
            </button>
            <button class="action-btn" id="sim-scenario-hetzner-maint" style="font-size: 0.76rem; justify-content: center;">
              🔧 Hetzner Issue
            </button>
            <button class="action-btn" id="sim-scenario-all-green" style="font-size: 0.76rem; justify-content: center; color: var(--status-operational);">
              ✅ All Operational
            </button>
          </div>
        </div>

        <!-- Section 2: Inject Live Incident -->
        <div style="margin-bottom: 18px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">
            Inject Live Incident
          </label>
          <form id="sim-incident-form" style="display: flex; flex-direction: column; gap: 8px;">
            <input
              type="text"
              id="sim-inc-title"
              placeholder="e.g. Major API gateway latency spike"
              required
              style="padding: 7px 10px; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary);"
            />
            <div style="display: flex; gap: 6px;">
              <select id="sim-inc-provider" style="flex: 1; padding: 6px; font-size: 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-secondary);">
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="github">GitHub</option>
                <option value="hetzner">Hetzner</option>
                <option value="core">Core Platform</option>
              </select>
              <select id="sim-inc-severity" style="flex: 1; padding: 6px; font-size: 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-secondary);">
                <option value="minor">Minor</option>
                <option value="major" selected>Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea
              id="sim-inc-msg"
              rows="2"
              placeholder="Investigation update note..."
              style="padding: 7px 10px; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); resize: none;"
            ></textarea>
            <button type="submit" class="action-btn primary" style="font-size: 0.8rem; justify-content: center;">
              Publish Incident to Feed
            </button>
          </form>
        </div>

        <!-- Section 3: Export & Plan Actions -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 14px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button class="action-btn" id="sim-copy-json" style="flex: 1; font-size: 0.78rem; justify-content: center;">
              ${icons.copy(14)}
              <span>Copy status.json</span>
            </button>
            <button class="action-btn" id="sim-download-json" style="flex: 1; font-size: 0.78rem; justify-content: center;">
              Download JSON
            </button>
          </div>
          <button class="action-btn" id="sim-reset-btn" style="font-size: 0.78rem; justify-content: center; color: var(--status-major);">
            Reset to Original Data
          </button>
        </div>
      </div>
    </div>
  `;

  const panel = document.getElementById("simulator-panel");
  const toggleBtn = document.getElementById("toggle-simulator-btn");
  const closeBtn = document.getElementById("close-simulator-btn");
  const banner = document.getElementById("sim-status-banner");
  const activeDot = document.getElementById("sim-active-indicator");

  function updateSimulatorUI() {
    if (store.isSimulated) {
      banner.style.display = "block";
      activeDot.style.display = "inline-block";
    } else {
      banner.style.display = "none";
      activeDot.style.display = "none";
    }
  }

  toggleBtn?.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  closeBtn?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Scenario 1: Gemini Outage
  document.getElementById("sim-scenario-gemini-outage")?.addEventListener("click", () => {
    store.updateComponentStatus("gemini-api", null, "major_outage");
    store.triggerSimulatedIncident(
      "Major API failure on Gemini 1.5 Pro inference endpoints",
      "gemini",
      "critical",
      "High rate of HTTP 500 error responses detected for multimodal generation."
    );
    updateSimulatorUI();
  });

  // Scenario 2: OpenAI Degraded
  document.getElementById("sim-scenario-openai-degraded")?.addEventListener("click", () => {
    store.updateComponentStatus("openai-api", "o1-reasoning", "degraded");
    store.triggerSimulatedIncident(
      "Elevated inference latency on OpenAI o1 models",
      "openai",
      "minor",
      "Reasoning tokens are experiencing queuing delays up to 8.5 seconds."
    );
    updateSimulatorUI();
  });

  // Scenario 3: Hetzner Issue
  document.getElementById("sim-scenario-hetzner-maint")?.addEventListener("click", () => {
    store.updateComponentStatus("hetzner-cloud", "hz-falkenstein", "partial_outage");
    updateSimulatorUI();
  });

  // Scenario 4: All Operational
  document.getElementById("sim-scenario-all-green")?.addEventListener("click", () => {
    store.isSimulated = true;
    for (const cat of store.data.categories) {
      for (const s of cat.services) {
        s.status = "operational";
        for (const c of s.components || []) {
          c.status = "operational";
        }
      }
    }
    if (store.data.incidents) store.data.incidents.active = [];
    store.recomputeOverallStatus();
    store.notify();
    updateSimulatorUI();
  });

  // Custom Incident Form Submit
  document.getElementById("sim-incident-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("sim-inc-title").value;
    const provider = document.getElementById("sim-inc-provider").value;
    const severity = document.getElementById("sim-inc-severity").value;
    const msg = document.getElementById("sim-inc-msg").value;

    store.triggerSimulatedIncident(title, provider, severity, msg);
    updateSimulatorUI();
    document.getElementById("sim-inc-title").value = "";
    document.getElementById("sim-inc-msg").value = "";
  });

  // Copy JSON
  document.getElementById("sim-copy-json")?.addEventListener("click", () => {
    navigator.clipboard.writeText(store.exportJsonString());
    alert("Copied current status.json to clipboard!");
  });

  // Download JSON
  document.getElementById("sim-download-json")?.addEventListener("click", () => {
    const jsonStr = store.exportJsonString();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "status.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Reset
  document.getElementById("sim-reset-btn")?.addEventListener("click", () => {
    store.resetSimulation();
    updateSimulatorUI();
  });

  store.subscribe(updateSimulatorUI);
}

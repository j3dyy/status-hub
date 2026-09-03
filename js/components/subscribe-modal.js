/**
 * Status Radar - Incident Subscription Modal Component
 * Saves subscribed users both locally (localStorage) and to data/subscribers.json via /api/subscribe
 */

import { icons } from "../utils/svg-icons.js";

const STORAGE_KEY = "status_radar_subscriptions";

function getLocalSubscriptions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveLocalSubscription(sub) {
  const subs = getLocalSubscriptions().filter(s => s.target !== sub.target);
  subs.push(sub);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  return subs;
}

function removeLocalSubscription(target) {
  const subs = getLocalSubscriptions().filter(s => s.target !== target);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  return subs;
}

function showToast(message) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `${icons.checkCircle(16, "status-operational")} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

async function persistSubscription(sub) {
  saveLocalSubscription(sub);

  // Attempt remote persistence if running with server
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    });
    if (res.ok) {
      const data = await res.json();
      console.log("[Status Radar] Subscription saved to data/subscribers.json:", data);
    }
  } catch (err) {
    // Graceful offline/static fallback (e.g. GitHub Pages)
    console.log("[Status Radar] Saved to local subscriber cache (static mode):", sub);
  }
}

async function removeSubscriptionRemote(target) {
  removeLocalSubscription(target);
  try {
    await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target })
    });
  } catch (err) {
    console.log("[Status Radar] Unsubscribed locally:", target);
  }
}

export function initSubscribeModal() {
  let modalMount = document.getElementById("modal-mount");
  if (!modalMount) {
    modalMount = document.createElement("div");
    modalMount.id = "modal-mount";
    document.body.appendChild(modalMount);
  }

  function renderSavedList() {
    const subs = getLocalSubscriptions();
    const mount = document.getElementById("saved-subscriptions-list");
    if (!mount) return;

    if (subs.length === 0) {
      mount.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">
          No active subscriptions registered yet.
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div style="margin-top: 14px; border-top: 1px dashed var(--border-subtle); padding-top: 12px;">
        <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">
          Your Active Subscriptions (${subs.length})
        </label>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${subs.map(s => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card-subtle); border-radius: var(--radius-sm); font-size: 0.8rem;">
              <span style="font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;">
                <span style="text-transform: uppercase; font-size: 0.68rem; padding: 2px 5px; background: var(--border-color); border-radius: 4px; margin-right: 6px;">${s.type}</span>
                ${s.target}
              </span>
              <button class="remove-sub-btn" data-target="${s.target}" title="Unsubscribe" style="color: var(--text-muted); cursor: pointer; padding: 2px;">
                ${icons.x(14)}
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    mount.querySelectorAll(".remove-sub-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const target = btn.getAttribute("data-target");
        await removeSubscriptionRemote(target);
        renderSavedList();
        showToast(`Unsubscribed ${target}`);
      });
    });
  }

  modalMount.innerHTML = `
    <div class="modal-backdrop" id="subscribe-modal-backdrop">
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="subscribe-modal-title">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${icons.bell(18, "text-primary")}
            <h3 id="subscribe-modal-title">Subscribe to Status Radar</h3>
          </div>
          <button class="icon-btn" id="close-subscribe-modal-btn" aria-label="Close modal">
            ${icons.x(16)}
          </button>
        </div>

        <div class="modal-body">
          <div class="subscribe-tab-group">
            <button class="subscribe-tab active" data-tab="email">Email</button>
            <button class="subscribe-tab" data-tab="slack">Slack / Discord</button>
            <button class="subscribe-tab" data-tab="rss">RSS / Atom</button>
            <button class="subscribe-tab" data-tab="json">JSON Feed</button>
          </div>

          <!-- Email Tab -->
          <div id="sub-tab-email" class="sub-tab-content">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">
              Get instant alerts for outages, service degradations, and maintenance windows.
            </p>
            <form id="email-subscribe-form" style="display: flex; gap: 8px;">
              <input
                type="email"
                id="email-input-field"
                required
                placeholder="eng-team@company.com"
                style="flex: 1; padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 0.88rem;"
              />
              <button type="submit" class="action-btn primary">
                Subscribe
              </button>
            </form>
          </div>

          <!-- Slack / Discord Tab -->
          <div id="sub-tab-slack" class="sub-tab-content" style="display: none;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">
              Deliver incident alerts straight to your team's Slack or Discord channel via incoming webhook.
            </p>
            <form id="webhook-subscribe-form" style="display: flex; gap: 8px;">
              <input
                type="url"
                id="webhook-input-field"
                required
                placeholder="https://hooks.slack.com/services/..."
                style="flex: 1; padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 0.88rem;"
              />
              <button type="submit" class="action-btn primary">
                Add Hook
              </button>
            </form>
          </div>

          <!-- RSS Tab -->
          <div id="sub-tab-rss" class="sub-tab-content" style="display: none;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
              Subscribe to standard RSS/Atom syndication feed for your feed reader.
            </p>
            <div style="display: flex; gap: 8px;">
              <input
                type="text"
                readonly
                id="rss-feed-url-input"
                value="${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, "")}/data/feed.xml"
                style="flex: 1; padding: 8px 12px; font-family: monospace; font-size: 0.8rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-card-subtle); color: var(--text-secondary);"
              />
              <button class="action-btn" id="copy-rss-btn" title="Copy RSS URL">
                ${icons.copy(14)}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <!-- JSON Feed Tab -->
          <div id="sub-tab-json" class="sub-tab-content" style="display: none;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
              Machine-readable static JSON endpoint for programmatic monitoring and uptime integrations.
            </p>
            <div style="display: flex; gap: 8px;">
              <input
                type="text"
                readonly
                id="json-feed-url-input"
                value="${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, "")}/data/status.json"
                style="flex: 1; padding: 8px 12px; font-family: monospace; font-size: 0.8rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-card-subtle); color: var(--text-secondary);"
              />
              <button class="action-btn" id="copy-json-btn" title="Copy JSON URL">
                ${icons.copy(14)}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <!-- Saved Subscriptions Manager -->
          <div id="saved-subscriptions-list"></div>
        </div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById("subscribe-modal-backdrop");
  const closeBtn = document.getElementById("close-subscribe-modal-btn");

  const openModal = () => {
    backdrop.classList.add("open");
    renderSavedList();
  };
  const closeModal = () => backdrop.classList.remove("open");

  document.addEventListener("click", (e) => {
    if (e.target.closest("#open-subscribe-modal")) {
      openModal();
    }
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("open")) {
      closeModal();
    }
  });

  // Tab switching
  modalMount.querySelectorAll(".subscribe-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      modalMount.querySelectorAll(".subscribe-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-tab");
      modalMount.querySelectorAll(".sub-tab-content").forEach(c => c.style.display = "none");
      document.getElementById(`sub-tab-${target}`).style.display = "block";
    });
  });

  // Copy buttons
  document.getElementById("copy-rss-btn")?.addEventListener("click", () => {
    const input = document.getElementById("rss-feed-url-input");
    navigator.clipboard.writeText(input.value);
    showToast("Copied RSS feed URL to clipboard!");
  });

  document.getElementById("copy-json-btn")?.addEventListener("click", () => {
    const input = document.getElementById("json-feed-url-input");
    navigator.clipboard.writeText(input.value);
    showToast("Copied status.json URL to clipboard!");
  });

  // Email form
  document.getElementById("email-subscribe-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-input-field").value.trim();
    if (!email) return;

    await persistSubscription({
      type: "email",
      target: email,
      createdAt: new Date().toISOString()
    });

    showToast(`Subscribed ${email}! Saved to subscribers.`);
    document.getElementById("email-input-field").value = "";
    renderSavedList();
  });

  // Webhook form
  document.getElementById("webhook-subscribe-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hook = document.getElementById("webhook-input-field").value.trim();
    if (!hook) return;

    await persistSubscription({
      type: "webhook",
      target: hook,
      createdAt: new Date().toISOString()
    });

    showToast(`Webhook saved! Real-time alerts enabled.`);
    document.getElementById("webhook-input-field").value = "";
    renderSavedList();
  });
}

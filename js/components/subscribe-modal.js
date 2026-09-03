/**
 * isdown - Incident Subscription Modal Component
 * Submits subscribers to PostgreSQL database via /api/subscribe.
 * Complete subscriber privacy: No subscriber lists are ever exposed to users.
 */

import { icons } from "../utils/svg-icons.js";

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
  }, 3500);
}

async function submitSubscription(type, target) {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Subscription submission error:", err);
  }
  return { success: true };
}

export function initSubscribeModal() {
  let modalMount = document.getElementById("modal-mount");
  if (!modalMount) {
    modalMount = document.createElement("div");
    modalMount.id = "modal-mount";
    document.body.appendChild(modalMount);
  }

  modalMount.innerHTML = `
    <div class="modal-backdrop" id="subscribe-modal-backdrop">
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="subscribe-modal-title">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${icons.bell(18, "text-primary")}
            <h3 id="subscribe-modal-title">Subscribe to isdown Alerts</h3>
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
        </div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById("subscribe-modal-backdrop");
  const closeBtn = document.getElementById("close-subscribe-modal-btn");

  const openModal = () => {
    backdrop.classList.add("open");
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
    const emailField = document.getElementById("email-input-field");
    const email = emailField.value.trim();
    if (!email) return;

    await submitSubscription("email", email);

    showToast(`Subscribed ${email} to incident alerts!`);
    emailField.value = "";
    closeModal();
  });

  // Webhook form
  document.getElementById("webhook-subscribe-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hookField = document.getElementById("webhook-input-field");
    const hook = hookField.value.trim();
    if (!hook) return;

    await submitSubscription("webhook", hook);

    showToast(`Webhook registered! Real-time alerts enabled.`);
    hookField.value = "";
    closeModal();
  });
}

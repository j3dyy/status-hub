/**
 * Status Radar - Interactive SVG Performance & Latency Chart Component
 */

export function renderMetricsChart(store) {
  const container = document.getElementById("metrics-chart-mount");
  if (!container) return;

  const data = store.data;
  if (!data || !data.metrics) {
    container.innerHTML = "";
    return;
  }

  const range = store.metricRange || "24h";
  const latencyConfig = data.metrics.latency;
  const seriesKey = `series${range}`;
  const points = latencyConfig[seriesKey] || latencyConfig.series24h || [];

  if (points.length === 0) {
    container.innerHTML = "";
    return;
  }

  // Calculate Chart Extents
  const values = points.map(p => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.2 || 10;
  const yMin = Math.max(0, Math.floor(minVal - padding));
  const yMax = Math.ceil(maxVal + padding);

  const width = 800;
  const height = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Map points to SVG coordinates
  const coords = points.map((pt, idx) => {
    const x = padLeft + (idx / (points.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.value - yMin) / (yMax - yMin)) * chartH;
    return { x, y, pt };
  });

  const linePathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`, "");
  const areaPathD = `${linePathD} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${padLeft} ${(padTop + chartH).toFixed(1)} Z`;

  // Guide lines
  const midVal = Math.round((yMin + yMax) / 2);
  const midY = padTop + chartH / 2;

  // Compute Min, Max, Avg, P95
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const p95Val = sorted[Math.floor(sorted.length * 0.95)] || maxVal;

  container.innerHTML = `
    <div class="container">
      <section class="metrics-section">
        <div class="metrics-section-header">
          <div class="metrics-title-wrap">
            <h2>System Response Latency (p50 API Roundtrip)</h2>
            <p>Measured globally via distributed edge probes across North America, Europe, and Asia-Pacific</p>
          </div>

          <div class="time-range-toggles" role="group" aria-label="Chart time range">
            <button class="range-btn ${range === "24h" ? "active" : ""}" data-range="24h">24 Hours</button>
            <button class="range-btn ${range === "7d" ? "active" : ""}" data-range="7d">7 Days</button>
            <button class="range-btn ${range === "30d" ? "active" : ""}" data-range="30d">30 Days</button>
          </div>
        </div>

        <div class="chart-container" id="latency-svg-wrapper">
          <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--brand-primary)" stop-opacity="0.4" />
                <stop offset="100%" stop-color="var(--brand-primary)" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Grid Lines -->
            <line x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}" class="chart-axis-line" />
            <text x="${padLeft - 8}" y="${padTop + 4}" text-anchor="end" class="chart-axis-text">${yMax}ms</text>

            <line x1="${padLeft}" y1="${midY}" x2="${width - padRight}" y2="${midY}" class="chart-axis-line" />
            <text x="${padLeft - 8}" y="${midY + 4}" text-anchor="end" class="chart-axis-text">${midVal}ms</text>

            <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" class="chart-axis-line" />
            <text x="${padLeft - 8}" y="${padTop + chartH + 4}" text-anchor="end" class="chart-axis-text">${yMin}ms</text>

            <!-- Area & Line -->
            <path d="${areaPathD}" class="chart-area-fill" />
            <path d="${linePathD}" class="chart-data-line" />

            <!-- Time Axis Labels -->
            ${coords.filter((_, i) => i === 0 || i === Math.floor(coords.length / 2) || i === coords.length - 1).map(c => `
              <text x="${c.x}" y="${height - 6}" text-anchor="middle" class="chart-axis-text">${c.pt.time}</text>
            `).join("")}

            <!-- Crosshair line & dot -->
            <line id="chart-crosshair-line" y1="${padTop}" y2="${padTop + chartH}" class="chart-crosshair" />
            <circle id="chart-hover-circle" r="4.5" class="chart-hover-dot" />
          </svg>
        </div>

        <div class="chart-stats-row">
          <div class="chart-stat-item">
            <span class="chart-stat-label">Current</span>
            <span class="chart-stat-val">${values[values.length - 1]} ms</span>
          </div>
          <div class="chart-stat-item">
            <span class="chart-stat-label">Average</span>
            <span class="chart-stat-val">${avgVal} ms</span>
          </div>
          <div class="chart-stat-item">
            <span class="chart-stat-label">95th Percentile</span>
            <span class="chart-stat-val">${p95Val} ms</span>
          </div>
          <div class="chart-stat-item">
            <span class="chart-stat-label">Minimum</span>
            <span class="chart-stat-val">${minVal} ms</span>
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach Range Toggles
  container.querySelectorAll(".range-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = btn.getAttribute("data-range");
      store.setMetricRange(r);
    });
  });

  // Attach Interactive Crosshair
  const wrapper = document.getElementById("latency-svg-wrapper");
  const crosshairLine = document.getElementById("chart-crosshair-line");
  const hoverCircle = document.getElementById("chart-hover-circle");
  const tooltip = document.getElementById("global-status-tooltip");

  if (wrapper && crosshairLine && hoverCircle) {
    wrapper.addEventListener("mousemove", (e) => {
      const rect = wrapper.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width * width;

      // Find nearest point
      let nearest = coords[0];
      let minDiff = Infinity;
      for (const c of coords) {
        const diff = Math.abs(c.x - relX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = c;
        }
      }

      crosshairLine.setAttribute("x1", nearest.x);
      crosshairLine.setAttribute("x2", nearest.x);
      crosshairLine.style.opacity = "1";

      hoverCircle.setAttribute("cx", nearest.x);
      hoverCircle.setAttribute("cy", nearest.y);
      hoverCircle.style.opacity = "1";

      if (tooltip) {
        tooltip.innerHTML = `<strong>${nearest.pt.value} ms</strong> &bull; ${nearest.pt.time}`;
        tooltip.style.display = "block";
        tooltip.style.left = `${rect.left + (nearest.x / width) * rect.width}px`;
        tooltip.style.top = `${rect.top + (nearest.y / height) * rect.height}px`;
      }
    });

    wrapper.addEventListener("mouseleave", () => {
      crosshairLine.style.opacity = "0";
      hoverCircle.style.opacity = "0";
      if (tooltip) tooltip.style.display = "none";
    });
  }
}

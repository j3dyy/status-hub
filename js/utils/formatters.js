/**
 * Status Radar - Formatting & Date Utilities
 */

export function formatDateTime(isoString, includeTimezone = true) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const options = {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };

  const formatted = new Intl.DateTimeFormat(undefined, options).format(date);
  if (includeTimezone) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    return `${formatted} (${tz})`;
  }
  return formatted;
}

export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 0) {
    // Future date (e.g. maintenance)
    const futureSec = Math.abs(diffSec);
    const mins = Math.floor(futureSec / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    if (mins > 0) return `in ${mins} min${mins > 1 ? "s" : ""}`;
    return "shortly";
  }

  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getStatusMeta(statusKey) {
  const map = {
    operational: {
      label: "Operational",
      class: "operational",
      icon: "checkCircle",
      description: "All services working normally"
    },
    degraded: {
      label: "Degraded Performance",
      class: "degraded",
      icon: "alertTriangle",
      description: "Some requests experiencing higher latency"
    },
    partial_outage: {
      label: "Partial Outage",
      class: "partial_outage",
      icon: "alertTriangle",
      description: "Certain features or regions temporarily offline"
    },
    major_outage: {
      label: "Major Outage",
      class: "major_outage",
      icon: "xCircle",
      description: "Significant service interruption affecting multiple systems"
    },
    maintenance: {
      label: "Under Maintenance",
      class: "maintenance",
      icon: "wrench",
      description: "Planned updates currently in progress"
    }
  };
  return map[statusKey] || map.operational;
}

export function generateIcsBlob(event) {
  const start = new Date(event.scheduledStart).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(event.scheduledEnd).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Status Radar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id || "maintenance"}@status-radar`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:[Maintenance] ${event.title}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

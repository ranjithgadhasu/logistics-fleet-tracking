const DAY = 86_400_000;

export function formatDate(iso, opts) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const mins = Math.round(abs / 60_000);
  let out;
  if (mins < 1) return "just now";
  if (mins < 60) out = `${mins}m`;
  else if (mins < 60 * 24) out = `${Math.round(mins / 60)}h`;
  else if (mins < 60 * 24 * 30) out = `${Math.round(mins / 1440)}d`;
  else out = `${Math.round(mins / 43200)}mo`;
  return future ? `in ${out}` : `${out} ago`;
}

export function daysUntil(iso) {
  const a = new Date(iso);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / DAY);
}

export function formatNumber(n, digits = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatKm(n) {
  return `${formatNumber(Math.round(n))} km`;
}

export function formatKg(n) {
  return n >= 1000 ? `${formatNumber(n / 1000, 1)} t` : `${formatNumber(n)} kg`;
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Turns an ISO string into the value an <input type="date"> expects. */
export function toDateInput(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

/** Turns an ISO string into the value an <input type="datetime-local"> expects. */
export function toDateTimeInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function isWithinRange(iso, from, to) {
  const t = new Date(iso).getTime();
  if (from && t < new Date(from + "T00:00:00").getTime()) return false;
  if (to && t > new Date(to + "T23:59:59").getTime()) return false;
  return true;
}

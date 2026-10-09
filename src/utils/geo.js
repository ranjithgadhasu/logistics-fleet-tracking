const R = 6371; // earth radius in km

const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance between two { lat, lng } points in km. */
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Roads are never straight – approximate road distance from straight-line distance. */
export function roadDistanceKm(a, b) {
  return Math.round(haversineKm(a, b) * 1.22);
}

/**
 * Builds a gently curved route between two points (quadratic bezier).
 * Without a routing API this gives a believable "road" for the map.
 */
export function buildRoute(a, b, steps = 40) {
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const control = { lat: mid.lat - dx * 0.12, lng: mid.lng + dy * 0.12 };
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * control.lat + t ** 2 * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * control.lng + t ** 2 * b.lng;
    pts.push({ lat, lng });
  }
  return pts;
}

/** Position along the curved route for a given progress (0-100). */
export function pointOnRoute(a, b, progress) {
  const route = buildRoute(a, b, 100);
  const idx = Math.max(0, Math.min(100, Math.round(progress)));
  return route[idx];
}

/** Splits the route into the travelled part and the remaining part. */
export function splitRoute(a, b, progress) {
  const route = buildRoute(a, b, 100);
  const idx = Math.max(0, Math.min(100, Math.round(progress)));
  return { done: route.slice(0, idx + 1), remaining: route.slice(idx) };
}

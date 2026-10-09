import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/utils/cn";

/**
 * Leaflet map wrapper.
 *
 * markers: [{ id, position: {lat,lng}, kind: "vehicle"|"pickup"|"delivery", color?, tooltip?, pulse? }]
 * routes:  [{ id, points: [{lat,lng}], color, dashed?, weight?, opacity? }]
 * fitKey:  change this value to re-fit the map to `fitTo` (or all markers)
 */

const truckSvg =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';

function markerIcon(m, selected) {
  if (m.kind === "vehicle") {
    const size = selected ? 40 : 32;
    return L.divIcon({
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `<div class="fleet-marker ${selected ? "is-selected" : ""}" style="--c:${m.color ?? "#6366f1"};width:${size}px;height:${size}px">
        ${m.pulse ? '<span class="fleet-marker-pulse"></span>' : ""}
        <span class="fleet-marker-dot">${truckSvg}</span>
      </div>`,
    });
  }
  const color = m.kind === "pickup" ? "#10b981" : "#6366f1";
  const letter = m.kind === "pickup" ? "A" : "B";
  return L.divIcon({
    className: "",
    iconSize: [28, 38],
    iconAnchor: [14, 36],
    html: `<div class="fleet-pin" style="--c:${color}"><span>${letter}</span></div>`,
  });
}

export function FleetMap({ markers, routes = [], selectedId, onMarkerClick, fitKey, fitTo, className, interactive = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;

  // create the map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: interactive,
      dragging: interactive,
      attributionControl: true,
    }).setView([39.5, -96], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);
    if (interactive) L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // draw markers & routes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    routes.forEach((r) => {
      L.polyline(
        r.points.map((p) => [p.lat, p.lng]),
        { color: r.color, weight: r.weight ?? 4, opacity: r.opacity ?? 0.9, dashArray: r.dashed ? "6 8" : undefined, lineCap: "round" },
      ).addTo(layer);
    });

    markers.forEach((m) => {
      const selected = m.id === selectedId;
      const mk = L.marker([m.position.lat, m.position.lng], {
        icon: markerIcon(m, selected),
        zIndexOffset: selected ? 1000 : m.kind === "vehicle" ? 100 : 0,
        keyboard: true,
        title: m.tooltip,
      }).addTo(layer);
      if (m.tooltip) mk.bindTooltip(m.tooltip, { direction: "top", offset: [0, m.kind === "vehicle" ? -14 : -34] });
      mk.on("click", () => clickRef.current?.(m.id));
    });
  }, [markers, routes, selectedId]);

  // fit bounds when requested
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pts = fitTo?.length ? fitTo : markers.map((m) => m.position);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo([pts[0].lat, pts[0].lng], 9, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
    map.flyToBounds(bounds, { padding: [48, 48], duration: 0.8, maxZoom: 9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return <div ref={containerRef} className={cn("h-full w-full bg-slate-100", className)} />;
}

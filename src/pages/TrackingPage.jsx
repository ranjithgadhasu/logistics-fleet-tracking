import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Gauge, Layers, MapPin, Navigation, Package, Search, Truck, User, X } from "lucide-react";
import { FleetMap } from "@/components/map/FleetMap";
import { Card, DataBoundary, EmptyState, ProgressBar, Skeleton, StatusBadge } from "@/components/ui";
import { SHIPMENT_STATUS, VEHICLE_STATUS } from "@/constants";
import { RouteLabel } from "@/features/shipments/ShipmentStatusParts";
import { liveShipmentFor, remainingHours, shipmentRoute, vehicleMarkers } from "@/features/tracking/mapData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFleetStore } from "@/store/fleetStore";
import { useLookups } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { formatDateTime, formatNumber, timeAgo } from "@/utils/format";
import { buildRoute } from "@/utils/geo";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "moving", label: "Moving" },
  { key: "delayed", label: "Delayed" },
  { key: "parked", label: "Parked" },
  { key: "maintenance", label: "Service" },
];

const LEGEND = [
  ["In transit", SHIPMENT_STATUS["in-transit"].color],
  ["Delayed", SHIPMENT_STATUS.delayed.color],
  ["Idle", VEHICLE_STATUS.idle.color],
  ["Maintenance", VEHICLE_STATUS.maintenance.color],
  ["Offline", VEHICLE_STATUS.offline.color],
];

function TrackingContent() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useFleetStore((s) => s.shipments);
  const lastSyncedAt = useFleetStore((s) => s.lastSyncedAt);
  const { driverById } = useLookups();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("vehicle");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showRoutes, setShowRoutes] = useState(true);

  const select = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set("vehicle", id);
    else next.delete("vehicle");
    setParams(next, { replace: true });
  };

  // every vehicle joined with its live shipment and driver
  const allRows = useMemo(
    () => vehicles.map((v) => ({ vehicle: v, live: liveShipmentFor(v.id, shipments), driver: v.driverId ? driverById.get(v.driverId) : undefined })),
    [vehicles, shipments, driverById],
  );

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    return allRows
      .filter(({ vehicle: v, live, driver }) => {
        if (term && ![v.plateNumber, v.make, v.model, v.city, driver?.name ?? "", live?.id ?? "", live?.delivery.city ?? ""].some((x) => x.toLowerCase().includes(term))) return false;
        if (filter === "moving") return live?.status === "in-transit";
        if (filter === "delayed") return live?.status === "delayed";
        if (filter === "parked") return !live && (v.status === "idle" || v.status === "active");
        if (filter === "maintenance") return v.status === "maintenance" || v.status === "offline";
        return true;
      })
      .sort((a, b) => Number(!!b.live) - Number(!!a.live) || (b.live?.status === "delayed" ? 1 : 0) - (a.live?.status === "delayed" ? 1 : 0));
  }, [allRows, q, filter]);

  const selected = allRows.find((r) => r.vehicle.id === selectedId);

  const map = useMemo(() => {
    const markers = vehicleMarkers(
      rows.map((r) => r.vehicle),
      shipments,
      driverById,
    );
    const routes = [];
    if (showRoutes && !selected?.live) {
      rows.forEach((r) => {
        if (r.live) routes.push({ id: r.live.id, points: buildRoute(r.live.pickup, r.live.delivery, 40), color: SHIPMENT_STATUS[r.live.status].color, weight: 2, opacity: 0.35, dashed: true });
      });
    }
    if (selected?.live) {
      const sr = shipmentRoute(selected.live);
      routes.push(...sr.routes);
      markers.unshift(...sr.markers);
    }
    return { markers, routes };
  }, [rows, shipments, driverById, selected, showRoutes]);

  const fitTo = selected?.live ? [selected.live.pickup, selected.live.delivery, selected.vehicle.location] : selected ? [selected.vehicle.location] : undefined;
  const liveCount = shipments.filter((s) => s.status === "in-transit" || s.status === "delayed").length;
  const delayedCount = shipments.filter((s) => s.status === "delayed").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Live tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            {liveCount} vehicles on the road · {delayedCount} delayed · updated {lastSyncedAt ? timeAgo(lastSyncedAt) : "—"}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> GPS feed active · refreshes every 8s
        </span>
      </div>

      <div className="flex flex-col-reverse gap-4 lg:h-[calc(100vh-13rem)] lg:min-h-[560px] lg:flex-row">
        {/* Vehicle list */}
        <Card className="flex max-h-[520px] flex-col overflow-hidden lg:max-h-none lg:w-[360px] lg:shrink-0">
          <div className="space-y-3 border-b border-slate-100 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search vehicle, driver, shipment…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                aria-label="Search vehicles"
              />
            </div>
            <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn("shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition", filter === f.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="thin-scrollbar flex-1 divide-y divide-slate-100 overflow-y-auto">
            {rows.length === 0 && <EmptyState title="No vehicles found" description="Try another search or filter." className="py-10" />}
            {rows.map(({ vehicle: v, live, driver }) => {
              const active = v.id === selectedId;
              return (
                <li key={v.id}>
                  <button onClick={() => select(active ? null : v.id)} className={cn("w-full p-4 text-left transition", active ? "bg-indigo-50/70" : "hover:bg-slate-50")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: live ? SHIPMENT_STATUS[live.status].color : VEHICLE_STATUS[v.status].color }}>
                          <Truck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{v.plateNumber}</p>
                          <p className="truncate text-xs text-slate-500">{driver?.name ?? "No driver"}</p>
                        </div>
                      </div>
                      {live ? <StatusBadge meta={SHIPMENT_STATUS[live.status]} /> : <StatusBadge meta={VEHICLE_STATUS[v.status]} />}
                    </div>
                    {live ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <RouteLabel from={live.pickup.city} to={live.delivery.city} className="text-xs" />
                          <span className="shrink-0 font-semibold text-slate-700">{Math.round(live.progress)}%</span>
                        </div>
                        <ProgressBar value={live.progress} color={SHIPMENT_STATUS[live.status].color} size="sm" />
                        <p className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{v.speed} km/h</span>
                          <span className={cn(live.status === "delayed" && "font-semibold text-rose-600")}>ETA {formatDateTime(live.eta)}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> Parked in {v.city}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Map */}
        <Card className="relative h-[60vh] min-h-[380px] flex-1 overflow-hidden lg:h-auto">
          <FleetMap
            markers={map.markers}
            routes={map.routes}
            selectedId={selectedId}
            onMarkerClick={(id) => vehicles.some((v) => v.id === id) && select(id)}
            fitKey={`${selectedId ?? "all"}-${filter}`}
            fitTo={fitTo}
          />

          {/* legend */}
          <div className="pointer-events-auto absolute left-3 top-3 z-[400] flex flex-col gap-2">
            <div className="rounded-xl bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
              <p className="mb-1.5 font-semibold text-slate-700">Legend</p>
              {LEGEND.map(([l, c]) => (
                <p key={l} className="flex items-center gap-2 py-0.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {l}
                </p>
              ))}
            </div>
            <button
              onClick={() => setShowRoutes((s) => !s)}
              className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium shadow-lg", showRoutes ? "bg-slate-900 text-white" : "bg-white text-slate-700")}
            >
              <Layers className="h-3.5 w-3.5" /> Routes {showRoutes ? "on" : "off"}
            </button>
          </div>

          {/* Selected vehicle panel */}
          {selected && (
            <div className="animate-slide-up absolute inset-x-3 bottom-3 z-[400] rounded-2xl bg-white p-4 shadow-2xl sm:left-auto sm:w-[360px]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-slate-900">{selected.vehicle.plateNumber}</p>
                  <p className="text-xs text-slate-500">
                    {selected.vehicle.make} {selected.vehicle.model} · {selected.vehicle.type}
                  </p>
                </div>
                <button onClick={() => select(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close details">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="flex items-center gap-1.5 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" /> {selected.driver?.name ?? "No driver"}
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Gauge className="h-3.5 w-3.5 text-slate-400" /> {selected.vehicle.speed ? `${selected.vehicle.speed} km/h` : "Stationary"}
                </p>
              </div>

              {selected.live ? (
                <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Package className="h-4 w-4 text-slate-400" /> {selected.live.id}
                    </span>
                    <StatusBadge meta={SHIPMENT_STATUS[selected.live.status]} />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="flex gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">A</span>
                      <span className="text-slate-600">{selected.live.pickup.address}</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">B</span>
                      <span className="text-slate-600">{selected.live.delivery.address}</span>
                    </p>
                  </div>
                  <ProgressBar value={selected.live.progress} color={SHIPMENT_STATUS[selected.live.status].color} />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[11px] text-slate-500">Remaining</p>
                      <p className="text-sm font-bold text-slate-900">{formatNumber((selected.live.distanceKm * (100 - selected.live.progress)) / 100)} km</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Drive time</p>
                      <p className="text-sm font-bold text-slate-900">~{Math.max(1, Math.round(remainingHours(selected.live)))} h</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">ETA</p>
                      <p className={cn("text-sm font-bold", selected.live.status === "delayed" ? "text-rose-600" : "text-slate-900")}>
                        {new Date(selected.live.eta).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  {selected.live.status === "delayed" && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700">
                      <Clock className="h-3.5 w-3.5" /> {selected.live.history[selected.live.history.length - 1]?.note}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  Not on a trip — currently {VEHICLE_STATUS[selected.vehicle.status].label.toLowerCase()} in {selected.vehicle.city}.
                </p>
              )}

              <div className="mt-3 flex gap-2">
                {selected.live && (
                  <Link to={`/shipments/${selected.live.id}`} className="flex-1 rounded-xl bg-indigo-600 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-500">
                    Shipment details
                  </Link>
                )}
                <Link to={`/vehicles/${selected.vehicle.id}`} className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Vehicle profile
                </Link>
              </div>
            </div>
          )}

          {!selected && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-[400] hidden -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/85 px-4 py-2 text-xs text-white shadow-lg sm:flex">
              <Navigation className="h-3.5 w-3.5" /> Select a vehicle to see its route and ETA
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-[520px] rounded-2xl lg:w-[360px]" />
        <Skeleton className="h-[520px] flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

export default function TrackingPage() {
  useDocumentTitle("Live tracking");
  return (
    <DataBoundary skeleton={<TrackingSkeleton />}>
      <TrackingContent />
    </DataBoundary>
  );
}

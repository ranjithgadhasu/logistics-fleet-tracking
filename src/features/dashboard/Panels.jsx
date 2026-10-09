import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Fuel, Gauge, MapPinned, Route, Wrench } from "lucide-react";
import { FleetMap } from "@/components/map/FleetMap";
import { Avatar, Card, CardHeader, EmptyState, ProgressBar } from "@/components/ui";
import { VEHICLE_STATUS } from "@/constants";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { useFleetStore } from "@/store/fleetStore";
import { useLookups } from "@/store/selectors";
import { formatNumber, percent } from "@/utils/format";
import { vehicleMarkers } from "../tracking/mapData";

/* --------------------------- Fleet performance --------------------------- */

export function FleetPerformance({ vehicleStatus, utilization, avgFuel, serviceDue, distance, total }) {
  return (
    <Card>
      <CardHeader
        title="Fleet performance"
        subtitle="Live vehicle status & health"
        action={
          <Link to="/vehicles" className="text-xs font-medium text-indigo-600 hover:underline">
            View fleet
          </Link>
        }
      />
      <div className="space-y-5 p-5">
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {vehicleStatus.map((s) => (
              <div key={s.status} style={{ width: `${percent(s.count, total)}%`, background: VEHICLE_STATUS[s.status].color }} title={`${VEHICLE_STATUS[s.status].label}: ${s.count}`} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {vehicleStatus.map((s) => (
              <Link key={s.status} to={`/vehicles?status=${s.status}`} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: VEHICLE_STATUS[s.status].color }} />
                  {VEHICLE_STATUS[s.status].label}
                </span>
                <span className="font-semibold text-slate-900">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric icon={<Gauge className="h-4 w-4" />} label="Utilization" value={`${utilization}%`} bar={utilization} color="#6366f1" />
          <Metric icon={<Fuel className="h-4 w-4" />} label="Avg. fuel" value={`${avgFuel}%`} bar={avgFuel} />
          <Metric icon={<Wrench className="h-4 w-4" />} label="Service due" value={String(serviceDue)} tone={serviceDue ? "text-amber-600" : undefined} />
          <Metric icon={<Route className="h-4 w-4" />} label="Distance (30d)" value={`${formatNumber(distance / 1000, 1)}k km`} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ icon, label, value, bar, color, tone }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${tone ?? "text-slate-900"}`}>{value}</p>
      {bar !== undefined && <ProgressBar value={bar} color={color} size="sm" className="mt-2" />}
    </div>
  );
}

/* ------------------------------ Live map card ---------------------------- */

export function LiveMapCard() {
  const navigate = useNavigate();
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useFleetStore((s) => s.shipments);
  const { driverById } = useLookups();
  const markers = useMemo(() => vehicleMarkers(vehicles, shipments, driverById), [vehicles, shipments, driverById]);
  const live = shipments.filter((s) => s.status === "in-transit" || s.status === "delayed").length;

  return (
    <Card className="flex flex-col overflow-hidden lg:col-span-2">
      <CardHeader
        title="Live fleet map"
        subtitle={`${live} vehicles on the road right now`}
        action={
          <Link to="/tracking" className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
            <MapPinned className="h-3.5 w-3.5" /> Open tracking
          </Link>
        }
      />
      <div className="relative m-5 mt-4 h-72 flex-1 overflow-hidden rounded-xl border border-slate-100 lg:h-auto lg:min-h-[320px]">
        <div className="absolute inset-0">
          <FleetMap markers={markers} fitKey="dashboard" onMarkerClick={(id) => navigate(`/tracking?vehicle=${id}`)} />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Top drivers ------------------------------ */

export function TopDrivers({ items }) {
  return (
    <Card>
      <CardHeader
        title="Top drivers"
        subtitle="Ranked by performance score"
        action={
          <Link to="/drivers" className="text-xs font-medium text-indigo-600 hover:underline">
            All drivers
          </Link>
        }
      />
      <ul className="space-y-1 p-3">
        {items.map(({ driver, metrics }, i) => (
          <li key={driver.id}>
            <Link to={`/drivers/${driver.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
              <span className="w-4 text-center text-xs font-bold text-slate-400">{i + 1}</span>
              <Avatar name={driver.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{driver.name}</p>
                <p className="text-xs text-slate-500">
                  {metrics.delivered} deliveries · {metrics.onTimeRate}% on time
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{metrics.score}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && <EmptyState title="No completed deliveries yet" className="py-8" />}
      </ul>
    </Card>
  );
}

/* --------------------------------- Alerts -------------------------------- */

export function AlertsPanel() {
  const notifications = useFleetStore((s) => s.notifications);
  const alerts = notifications.filter((n) => (n.severity === "critical" || n.severity === "warning") && !n.read).slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Active alerts"
        subtitle="Unread warnings & critical issues"
        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        action={
          <Link to="/notifications" className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 hover:underline">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <div className="mt-3 flex-1 divide-y divide-slate-100">
        {alerts.length === 0 ? (
          <EmptyState title="No active alerts" description="Everything is running smoothly." className="py-10" />
        ) : (
          alerts.map((n) => <NotificationItem key={n.id} notification={n} compact />)
        )}
      </div>
    </Card>
  );
}

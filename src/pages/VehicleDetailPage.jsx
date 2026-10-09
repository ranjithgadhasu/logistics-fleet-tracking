import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Fuel, Gauge, MapPin, Package, Pencil, Trash2, Truck, Weight, Wrench } from "lucide-react";
import { FleetMap } from "@/components/map/FleetMap";
import { Avatar, Button, Card, CardHeader, ConfirmDialog, DataBoundary, EmptyState, InfoRow, ProgressBar, Select, StatusBadge } from "@/components/ui";
import { DRIVER_STATUS, SHIPMENT_STATUS, VEHICLE_STATUS } from "@/constants";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import { RouteLabel } from "@/features/shipments/ShipmentStatusParts";
import { liveShipmentFor, remainingHours, shipmentRoute } from "@/features/tracking/mapData";
import { VehicleFormModal } from "@/features/vehicles/VehicleFormModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFleetStore } from "@/store/fleetStore";
import { serviceState } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { daysUntil, formatDate, formatDateTime, formatKg, formatKm, formatNumber } from "@/utils/format";

function VehicleDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const vehicle = useFleetStore((s) => s.vehicles.find((v) => v.id === id));
  const drivers = useFleetStore((s) => s.drivers);
  const shipments = useFleetStore((s) => s.shipments);
  const activities = useFleetStore((s) => s.activities);
  const assignDriver = useFleetStore((s) => s.assignDriver);
  const updateVehicle = useFleetStore((s) => s.updateVehicle);
  const deleteVehicle = useFleetStore((s) => s.deleteVehicle);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(null);
  useDocumentTitle(vehicle ? vehicle.plateNumber : "Vehicle");

  const history = useMemo(() => activities.filter((a) => a.entityType === "vehicle" && a.entityId === id), [activities, id]);
  const trips = useMemo(() => shipments.filter((s) => s.vehicleId === id).sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)), [shipments, id]);
  const live = vehicle ? liveShipmentFor(vehicle.id, shipments) : undefined;

  const map = useMemo(() => {
    if (!vehicle) return { markers: [], routes: [] };
    const base = [{ id: vehicle.id, position: vehicle.location, kind: "vehicle", color: VEHICLE_STATUS[vehicle.status].color, pulse: !!live, tooltip: vehicle.plateNumber }];
    if (!live) return { markers: base, routes: [] };
    const r = shipmentRoute(live);
    return { markers: [...r.markers, ...base], routes: r.routes };
  }, [vehicle, live]);

  if (!vehicle) {
    return (
      <Card>
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Vehicle not found" description="It may have been removed from the fleet." action={<Button onClick={() => navigate("/vehicles")}>Back to vehicles</Button>} />
      </Card>
    );
  }

  const driver = vehicle.driverId ? drivers.find((d) => d.id === vehicle.driverId) : undefined;
  const svc = serviceState(vehicle);
  const days = daysUntil(vehicle.nextServiceDate);
  const delivered = trips.filter((t) => t.status === "delivered");
  const totalKm = delivered.reduce((s, t) => s + t.distanceKm, 0);

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      /* toast shown */
    } finally {
      setBusy(null);
    }
  };

  const markServiced = () => {
    const now = new Date();
    return run("service", () =>
      updateVehicle(vehicle.id, {
        lastServiceDate: now.toISOString(),
        nextServiceDate: new Date(now.getTime() + 180 * 86_400_000).toISOString(),
        ...(vehicle.status === "maintenance" ? { status: "idle" } : {}),
      }),
    );
  };

  const headerStats = [
    { icon: Fuel, label: vehicle.fuelType === "Electric" ? "Charge" : "Fuel level", value: `${Math.round(vehicle.fuelLevel)}%`, extra: <ProgressBar value={vehicle.fuelLevel} size="sm" className="mt-2" /> },
    { icon: Gauge, label: "Odometer", value: formatKm(vehicle.mileage) },
    { icon: Weight, label: "Capacity", value: formatKg(vehicle.capacityKg) },
    { icon: MapPin, label: "Speed", value: vehicle.speed ? `${vehicle.speed} km/h` : "Parked" },
  ];

  return (
    <>
      <Link to="/vehicles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Vehicles
      </Link>

      {/* Header */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{vehicle.plateNumber}</h1>
                <StatusBadge meta={VEHICLE_STATUS[vehicle.status]} />
              </div>
              <p className="text-sm text-slate-500">
                {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.type} · {vehicle.id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Change status"
              value={vehicle.status}
              disabled={!!live || busy === "status"}
              onChange={(e) => run("status", () => updateVehicle(vehicle.id, { status: e.target.value }))}
              className="h-10 w-40"
            >
              {Object.entries(VEHICLE_STATUS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outline" className="text-rose-600 hover:bg-rose-50" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Remove
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
          {headerStats.map((s, i) => (
            <div key={s.label} className={cn("p-4 sm:p-5", i % 2 === 1 && "border-l border-slate-100", i >= 2 && "border-t border-slate-100 sm:border-t-0", i === 2 && "sm:border-l")}>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{s.value}</p>
              {s.extra}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Live trip + map */}
          <Card className="overflow-hidden">
            <CardHeader
              title={live ? "Current trip" : "Current location"}
              subtitle={live ? <RouteLabel from={live.pickup.city} to={live.delivery.city} className="text-xs" /> : vehicle.city}
              action={
                live && (
                  <Link to={`/shipments/${live.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                    {live.id}
                  </Link>
                )
              }
            />
            {live && (
              <div className="grid grid-cols-3 gap-3 px-5 pt-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Progress</p>
                  <p className="font-semibold">{Math.round(live.progress)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="font-semibold">~{Math.max(1, Math.round(remainingHours(live)))} h</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ETA</p>
                  <p className={cn("font-semibold", live.status === "delayed" && "text-rose-600")}>{formatDateTime(live.eta)}</p>
                </div>
                <ProgressBar value={live.progress} color={SHIPMENT_STATUS[live.status].color} className="col-span-3" />
              </div>
            )}
            <div className="m-5 h-72 overflow-hidden rounded-xl border border-slate-100">
              <FleetMap markers={map.markers} routes={map.routes} selectedId={vehicle.id} fitKey={`${vehicle.id}-${live?.id ?? "none"}`} />
            </div>
          </Card>

          {/* Trip history */}
          <Card>
            <CardHeader title="Shipment history" subtitle={`${delivered.length} completed trips · ${formatNumber(totalKm)} km driven`} icon={<Package className="h-4 w-4" />} />
            <div className="mt-3 divide-y divide-slate-100">
              {trips.length === 0 ? (
                <EmptyState title="No shipments yet" description="Trips handled by this vehicle will appear here." className="py-10" />
              ) : (
                trips.slice(0, 8).map((t) => (
                  <Link key={t.id} to={`/shipments/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t.id}</p>
                      <RouteLabel from={t.pickup.city} to={t.delivery.city} className="text-xs text-slate-500" />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge meta={SHIPMENT_STATUS[t.status]} />
                      <span className="text-xs text-slate-400">{formatDate(t.pickupDate)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Driver assignment */}
          <Card>
            <CardHeader title="Assigned driver" />
            <div className="space-y-4 p-5">
              {driver ? (
                <Link to={`/drivers/${driver.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <Avatar name={driver.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{driver.name}</p>
                    <p className="truncate text-xs text-slate-500">{driver.phone}</p>
                  </div>
                  <StatusBadge meta={DRIVER_STATUS[driver.status]} />
                </Link>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No driver assigned</p>
              )}
              <Select aria-label="Assign driver" value={vehicle.driverId ?? ""} disabled={!!live || busy === "assign"} onChange={(e) => run("assign", () => assignDriver(vehicle.id, e.target.value || null))}>
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {DRIVER_STATUS[d.status].label}
                    {d.vehicleId && d.vehicleId !== vehicle.id ? ` (has ${d.vehicleId})` : ""}
                  </option>
                ))}
              </Select>
              {live && <p className="text-xs text-slate-500">Assignment is locked while the vehicle is on a live trip.</p>}
            </div>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader title="Maintenance" icon={<Wrench className="h-4 w-4" />} />
            <div className="p-5 pt-3">
              <div className={cn("mb-3 rounded-xl p-3 text-sm", svc === "overdue" ? "bg-rose-50 text-rose-700" : svc === "due-soon" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                <p className="flex items-center gap-2 font-semibold">
                  <CalendarClock className="h-4 w-4" />
                  {svc === "overdue" ? `Service overdue by ${Math.abs(days)} days` : svc === "due-soon" ? `Service due in ${days} days` : `Next service in ${days} days`}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                <InfoRow label="Last service" value={formatDate(vehicle.lastServiceDate)} />
                <InfoRow label="Next service" value={formatDate(vehicle.nextServiceDate)} />
                <InfoRow label="Fuel type" value={vehicle.fuelType} />
                <InfoRow label="Efficiency" value={`${vehicle.fuelEfficiency} km/${vehicle.fuelType === "Electric" ? "kWh" : "L"}`} />
              </div>
              <Button variant="outline" className="mt-3 w-full" loading={busy === "service"} onClick={markServiced} icon={<Wrench className="h-4 w-4" />}>
                Mark as serviced today
              </Button>
            </div>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader title="Specifications" />
            <div className="divide-y divide-slate-100 px-5 pb-3 pt-2">
              <InfoRow label="Make / model" value={`${vehicle.make} ${vehicle.model}`} />
              <InfoRow label="Year" value={vehicle.year} />
              <InfoRow label="Type" value={vehicle.type} />
              <InfoRow label="Home city" value={vehicle.city} />
              <InfoRow label="In fleet since" value={formatDate(vehicle.createdAt)} />
            </div>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader title="Activity history" />
            <div className="thin-scrollbar max-h-96 overflow-y-auto p-5">
              <ActivityFeed items={history} limit={20} emptyText="No activity recorded" />
            </div>
          </Card>
        </div>
      </div>

      <VehicleFormModal open={editOpen} onClose={() => setEditOpen(false)} vehicle={vehicle} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteVehicle(vehicle.id);
          navigate("/vehicles");
        }}
        title="Remove vehicle?"
        message={`${vehicle.plateNumber} will be permanently removed from your fleet.`}
        confirmLabel="Remove vehicle"
      />
    </>
  );
}

export default function VehicleDetailPage() {
  return (
    <DataBoundary>
      <VehicleDetail />
    </DataBoundary>
  );
}

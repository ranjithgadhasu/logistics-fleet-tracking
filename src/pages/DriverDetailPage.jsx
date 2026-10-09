import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Award, BadgeCheck, CalendarDays, Clock, IdCard, Mail, MapPin, Package, Pencil, Phone, Route, Star, Trash2, Truck, User } from "lucide-react";
import { Avatar, Button, Card, CardHeader, ConfirmDialog, DataBoundary, DataTable, EmptyState, InfoRow, Select, StatCard, StatusBadge } from "@/components/ui";
import { DRIVER_STATUS, SHIPMENT_STATUS, VEHICLE_STATUS } from "@/constants";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import { DriverFormModal } from "@/features/drivers/DriverFormModal";
import { RouteLabel } from "@/features/shipments/ShipmentStatusParts";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFleetStore } from "@/store/fleetStore";
import { getDriverMetrics, wasOnTime } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { daysUntil, formatDate, formatDateTime, formatNumber } from "@/utils/format";

function DriverDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const driver = useFleetStore((s) => s.drivers.find((d) => d.id === id));
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useFleetStore((s) => s.shipments);
  const activities = useFleetStore((s) => s.activities);
  const updateDriver = useFleetStore((s) => s.updateDriver);
  const deleteDriver = useFleetStore((s) => s.deleteDriver);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(driver?.name ?? "Driver");

  const mine = useMemo(() => shipments.filter((s) => s.driverId === id), [shipments, id]);
  const history = useMemo(() => activities.filter((a) => a.entityType === "driver" && a.entityId === id), [activities, id]);

  // deliveries per week, last 6 weeks
  const weekly = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => {
      const end = now - (5 - i) * 7 * 86_400_000;
      const start = end - 7 * 86_400_000;
      const list = mine.filter((s) => s.deliveredAt && new Date(s.deliveredAt) > start && new Date(s.deliveredAt) <= end);
      return {
        week: new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        onTime: list.filter(wasOnTime).length,
        late: list.filter((s) => !wasOnTime(s)).length,
      };
    });
  }, [mine]);

  if (!driver) {
    return (
      <Card>
        <EmptyState icon={<User className="h-7 w-7" />} title="Driver not found" description="This driver may have been removed." action={<Button onClick={() => navigate("/drivers")}>Back to drivers</Button>} />
      </Card>
    );
  }

  const m = getDriverMetrics(driver, shipments);
  const vehicle = driver.vehicleId ? vehicles.find((v) => v.id === driver.vehicleId) : undefined;
  const licenseDays = daysUntil(driver.licenseExpiry);
  const onLiveTrip = mine.some((s) => s.status === "in-transit" || s.status === "delayed");

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "Shipment", sortValue: (s) => s.id, render: (s) => <span className="font-semibold text-slate-900">{s.id}</span> },
    { key: "route", header: "Route", render: (s) => <RouteLabel from={s.pickup.city} to={s.delivery.city} /> },
    { key: "status", header: "Status", sortValue: (s) => s.status, render: (s) => <StatusBadge meta={SHIPMENT_STATUS[s.status]} /> },
    { key: "date", header: "Pickup", sortValue: (s) => s.pickupDate, render: (s) => <span className="text-sm text-slate-600">{formatDate(s.pickupDate)}</span> },
    {
      key: "result",
      header: "Result",
      hideBelow: "lg",
      render: (s) =>
        s.status === "delivered" ? (
          <span className={cn("text-xs font-semibold", wasOnTime(s) ? "text-emerald-600" : "text-rose-600")}>{wasOnTime(s) ? "On time" : "Late"}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <>
      <Link to="/drivers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Drivers
      </Link>

      <Card className="mb-4 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 sm:h-24" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar name={driver.name} size="xl" className="ring-4" />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{driver.name}</h1>
                <StatusBadge meta={DRIVER_STATUS[driver.status]} />
              </div>
              <p className="text-sm text-slate-500">
                {driver.id} · {driver.city} · joined {formatDate(driver.joinedAt, { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select aria-label="Change availability" value={driver.status} disabled={busy} onChange={(e) => run(() => updateDriver(driver.id, { status: e.target.value }))} className="h-10 w-36">
              {Object.entries(DRIVER_STATUS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
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
      </Card>

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Deliveries" value={m.delivered} icon={<Package className="h-5 w-5" />} accent="indigo" hint={`${m.active} active now`} />
        <StatCard label="On-time rate" value={m.delivered ? `${m.onTimeRate}%` : "—"} icon={<Clock className="h-5 w-5" />} accent="emerald" hint={`${m.late} late`} />
        <StatCard label="Rating" value={driver.rating.toFixed(1)} icon={<Star className="h-5 w-5" />} accent="amber" hint="customer feedback" />
        <StatCard label="Performance score" value={m.score} icon={<Award className="h-5 w-5" />} accent="violet" hint={`${formatNumber(m.distanceKm)} km driven`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Weekly deliveries" subtitle="Last 6 weeks — on time vs late" />
            <div className="h-60 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 0, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="onTime" name="On time" stackId="a" fill="#6366f1" />
                  <Bar dataKey="late" name="Late" stackId="a" fill="#fb7185" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Delivery history" subtitle={`${mine.length} shipments handled`} icon={<Route className="h-4 w-4" />} />
            <div className="mt-3">
              <DataTable
                columns={columns}
                rows={mine}
                rowKey={(s) => s.id}
                pageSize={6}
                initialSort={{ key: "date", dir: "desc" }}
                onRowClick={(s) => navigate(`/shipments/${s.id}`)}
                empty={<EmptyState title="No deliveries yet" className="py-10" />}
                mobileCard={(s) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{s.id}</p>
                      <RouteLabel from={s.pickup.city} to={s.delivery.city} className="text-xs text-slate-500" />
                      <p className="text-xs text-slate-400">{formatDateTime(s.pickupDate)}</p>
                    </div>
                    <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                  </div>
                )}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Contact" />
            <div className="divide-y divide-slate-100 px-5 pb-3 pt-2">
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={
                  <a className="text-indigo-600 hover:underline" href={`mailto:${driver.email}`}>
                    {driver.email}
                  </a>
                }
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={
                  <a className="hover:underline" href={`tel:${driver.phone}`}>
                    {driver.phone}
                  </a>
                }
              />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Base" value={driver.city} />
              <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Experience" value={`${driver.experienceYears} years`} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Assigned vehicle" icon={<Truck className="h-4 w-4" />} />
            <div className="space-y-3 p-5 pt-4">
              {vehicle ? (
                <Link to={`/vehicles/${vehicle.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{vehicle.plateNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                  <StatusBadge meta={VEHICLE_STATUS[vehicle.status]} />
                </Link>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No vehicle assigned</p>
              )}
              <Select aria-label="Assign vehicle" value={driver.vehicleId ?? ""} disabled={busy || onLiveTrip} onChange={(e) => run(() => updateDriver(driver.id, { vehicleId: e.target.value || null }))}>
                <option value="">— No vehicle —</option>
                {vehicles
                  .filter((v) => v.status !== "offline")
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} · {v.type}
                      {v.driverId && v.driverId !== driver.id ? " (assigned)" : ""}
                    </option>
                  ))}
              </Select>
              {onLiveTrip && <p className="text-xs text-slate-500">Locked while the driver is on an active delivery.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="License" icon={<IdCard className="h-4 w-4" />} />
            <div className="p-5 pt-3">
              <div className={cn("mb-2 flex items-center gap-2 rounded-xl p-3 text-sm font-medium", licenseDays < 30 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                <BadgeCheck className="h-4 w-4" />
                {licenseDays < 0 ? "License expired" : licenseDays < 30 ? `Expires in ${licenseDays} days` : "Valid"}
              </div>
              <div className="divide-y divide-slate-100">
                <InfoRow label="Number" value={driver.licenseNumber} />
                <InfoRow label="Expiry" value={formatDate(driver.licenseExpiry)} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <div className="thin-scrollbar max-h-80 overflow-y-auto p-5">
              <ActivityFeed items={history} emptyText="No recent activity" />
            </div>
          </Card>
        </div>
      </div>

      <DriverFormModal open={editOpen} onClose={() => setEditOpen(false)} driver={driver} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteDriver(driver.id);
          navigate("/drivers");
        }}
        title="Remove driver?"
        message={`${driver.name} will be permanently removed from the roster.`}
        confirmLabel="Remove driver"
      />
    </>
  );
}

export default function DriverDetailPage() {
  return (
    <DataBoundary>
      <DriverDetail />
    </DataBoundary>
  );
}

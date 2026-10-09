import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Clock, Mail, MapPin, Navigation, Package, Pencil, Phone, RefreshCw, Trash2, Truck, User, Weight } from "lucide-react";
import { FleetMap } from "@/components/map/FleetMap";
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, DataBoundary, EmptyState, InfoRow, ProgressBar, StatusBadge } from "@/components/ui";
import { DRIVER_STATUS, PRIORITY, SHIPMENT_STATUS } from "@/constants";
import { ShipmentFormModal } from "@/features/shipments/ShipmentFormModal";
import { ShipmentTimeline, StatusStepper, StatusUpdateModal } from "@/features/shipments/ShipmentStatusParts";
import { remainingHours, shipmentRoute } from "@/features/tracking/mapData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFleetStore } from "@/store/fleetStore";
import { isLiveShipment, wasOnTime } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { formatDateTime, formatKg, formatNumber, timeAgo } from "@/utils/format";

function ShipmentDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const shipment = useFleetStore((s) => s.shipments.find((x) => x.id === id));
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const deleteShipment = useFleetStore((s) => s.deleteShipment);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useDocumentTitle(shipment?.id ?? "Shipment");

  const vehicle = shipment?.vehicleId ? vehicles.find((v) => v.id === shipment.vehicleId) : undefined;
  const driver = shipment?.driverId ? drivers.find((d) => d.id === shipment.driverId) : undefined;

  const map = useMemo(() => {
    if (!shipment) return { markers: [], routes: [] };
    const r = shipmentRoute(shipment);
    const markers = [...r.markers];
    if (vehicle && isLiveShipment(shipment)) {
      markers.push({ id: vehicle.id, position: vehicle.location, kind: "vehicle", color: SHIPMENT_STATUS[shipment.status].color, pulse: true, tooltip: `${vehicle.plateNumber} · ${vehicle.speed} km/h` });
    }
    return { markers, routes: r.routes };
  }, [shipment, vehicle]);

  if (!shipment) {
    return (
      <Card>
        <EmptyState icon={<Package className="h-7 w-7" />} title="Shipment not found" description="It may have been deleted." action={<Button onClick={() => navigate("/shipments")}>Back to shipments</Button>} />
      </Card>
    );
  }

  const live = isLiveShipment(shipment);
  const done = shipment.status === "delivered" || shipment.status === "cancelled";
  const hoursLeft = remainingHours(shipment);
  const kmLeft = (shipment.distanceKm * (100 - shipment.progress)) / 100;

  return (
    <>
      <Link to="/shipments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Shipments
      </Link>

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{shipment.id}</h1>
              <StatusBadge meta={SHIPMENT_STATUS[shipment.status]} />
              <Badge tone={PRIORITY[shipment.priority].tone}>{PRIORITY[shipment.priority].label} priority</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {shipment.customer.company} · {shipment.cargo} · created {timeAgo(shipment.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!done && (
              <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => setStatusOpen(true)}>
                Update status
              </Button>
            )}
            {live && (
              <Button variant="outline" icon={<Navigation className="h-4 w-4" />} onClick={() => navigate(`/tracking?vehicle=${shipment.vehicleId}`)}>
                Track live
              </Button>
            )}
            {!done && (
              <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {!live && (
              <Button variant="outline" className="text-rose-600 hover:bg-rose-50" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-5 sm:px-8">
          {shipment.status === "cancelled" ? <p className="text-center text-sm font-medium text-slate-500">This shipment was cancelled.</p> : <StatusStepper status={shipment.status} />}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader title="Route" subtitle={`${formatNumber(shipment.distanceKm)} km · ${shipment.pickup.city} → ${shipment.delivery.city}`} />
            <div className="grid gap-3 px-5 pt-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Progress</p>
                <p className="text-lg font-bold text-slate-900">{Math.round(shipment.progress)}%</p>
                <ProgressBar value={shipment.progress} color={SHIPMENT_STATUS[shipment.status].color} size="sm" className="mt-2" />
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{shipment.deliveredAt ? "Delivered" : "Estimated delivery"}</p>
                <p className={cn("text-lg font-bold", shipment.status === "delayed" ? "text-rose-600" : "text-slate-900")}>{formatDateTime(shipment.deliveredAt ?? shipment.eta)}</p>
                <p className="text-xs text-slate-500">
                  {shipment.deliveredAt ? (wasOnTime(shipment) ? "✓ On time" : "Late delivery") : shipment.status === "delayed" ? "ETA exceeded" : timeAgo(shipment.eta)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Time remaining</p>
                <p className="text-lg font-bold text-slate-900">{live ? `~${Math.max(1, Math.round(hoursLeft))} h` : done ? "—" : "Not started"}</p>
                <p className="text-xs text-slate-500">{live && vehicle ? `${vehicle.speed} km/h now` : `${formatNumber(kmLeft)} km left`}</p>
              </div>
            </div>
            <div className="m-5 h-80 overflow-hidden rounded-xl border border-slate-100">
              <FleetMap markers={map.markers} routes={map.routes} selectedId={vehicle?.id} fitKey={shipment.id} fitTo={[shipment.pickup, shipment.delivery]} />
            </div>
            <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">A</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup</p>
                  <p className="text-sm font-medium text-slate-900">{shipment.pickup.address}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(shipment.pickupDate)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">B</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</p>
                  <p className="text-sm font-medium text-slate-900">{shipment.delivery.address}</p>
                  <p className="text-xs text-slate-500">ETA {formatDateTime(shipment.eta)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tracking history" subtitle={`${shipment.history.length} events`} icon={<Clock className="h-4 w-4" />} />
            <div className="p-5">
              <ShipmentTimeline shipment={shipment} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Customer" icon={<Building2 className="h-4 w-4" />} />
            <div className="divide-y divide-slate-100 px-5 pb-3 pt-2">
              <InfoRow label="Company" value={shipment.customer.company} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Contact" value={shipment.customer.name} />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={
                  <a href={`mailto:${shipment.customer.email}`} className="text-indigo-600 hover:underline">
                    {shipment.customer.email}
                  </a>
                }
              />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={shipment.customer.phone} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Assignment" />
            <div className="space-y-3 p-5 pt-4">
              {driver ? (
                <Link to={`/drivers/${driver.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <Avatar name={driver.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{driver.name}</p>
                    <p className="text-xs text-slate-500">{driver.phone}</p>
                  </div>
                  <StatusBadge meta={DRIVER_STATUS[driver.status]} />
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-sm text-slate-500">No driver assigned</div>
              )}
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
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-sm text-slate-500">No vehicle assigned</div>
              )}
              {!done && (!driver || !vehicle) && (
                <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                  Assign driver & vehicle
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Cargo" icon={<Package className="h-4 w-4" />} />
            <div className="divide-y divide-slate-100 px-5 pb-3 pt-2">
              <InfoRow label="Description" value={shipment.cargo} />
              <InfoRow icon={<Weight className="h-4 w-4" />} label="Weight" value={formatKg(shipment.weightKg)} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Distance" value={`${formatNumber(shipment.distanceKm)} km`} />
              <InfoRow label="Priority" value={<Badge tone={PRIORITY[shipment.priority].tone}>{PRIORITY[shipment.priority].label}</Badge>} />
            </div>
          </Card>
        </div>
      </div>

      <ShipmentFormModal open={editOpen} onClose={() => setEditOpen(false)} shipment={shipment} />
      <StatusUpdateModal shipment={shipment} open={statusOpen} onClose={() => setStatusOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteShipment(shipment.id);
          navigate("/shipments");
        }}
        title="Delete shipment?"
        message={`${shipment.id} and its tracking history will be permanently deleted.`}
        confirmLabel="Delete shipment"
      />
    </>
  );
}

export default function ShipmentDetailPage() {
  return (
    <DataBoundary>
      <ShipmentDetail />
    </DataBoundary>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { FilterBar, FilterDate, FilterSelect } from "@/components/filters/FilterBar";
import { Badge, Button, Card, ConfirmDialog, DataBoundary, DataTable, EmptyState, PageHeader, ProgressBar, StatusBadge, Tabs } from "@/components/ui";
import { CITY_NAMES, PRIORITY, SHIPMENT_STATUS } from "@/constants";
import { ShipmentFormModal } from "@/features/shipments/ShipmentFormModal";
import { RouteLabel, StatusUpdateModal } from "@/features/shipments/ShipmentStatusParts";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useFleetStore } from "@/store/fleetStore";
import { isActiveShipment, isLiveShipment, useLookups } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { formatDateTime, isWithinRange, timeAgo } from "@/utils/format";

const DEFAULTS = { q: "", status: "", priority: "", driver: "", vehicle: "", city: "", from: "", to: "" };
const TAB_KEYS = ["", "active", "in-transit", "delayed", "pending", "assigned", "delivered", "cancelled"];
const TAB_LABEL = { "": "All", active: "Active", ...Object.fromEntries(Object.entries(SHIPMENT_STATUS).map(([k, m]) => [k, m.label])) };

function matchesStatus(s, key) {
  if (!key) return true;
  if (key === "active") return isActiveShipment(s);
  return s.status === key;
}

function ShipmentsContent() {
  const navigate = useNavigate();
  const shipments = useFleetStore((s) => s.shipments);
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const deleteShipment = useFleetStore((s) => s.deleteShipment);
  const { driverById, vehicleById } = useLookups();
  const { filters, setFilter, clear, activeCount } = useUrlFilters(DEFAULTS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFor, setStatusFor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return shipments.filter((s) => {
      if (q && ![s.id, s.customer.name, s.customer.company, s.customer.email, s.cargo, s.pickup.city, s.delivery.city].some((x) => x.toLowerCase().includes(q))) return false;
      if (!matchesStatus(s, filters.status)) return false;
      if (filters.priority && s.priority !== filters.priority) return false;
      if (filters.driver && s.driverId !== (filters.driver === "none" ? null : filters.driver)) return false;
      if (filters.vehicle && s.vehicleId !== (filters.vehicle === "none" ? null : filters.vehicle)) return false;
      if (filters.city && s.pickup.city !== filters.city && s.delivery.city !== filters.city) return false;
      if ((filters.from || filters.to) && !isWithinRange(s.pickupDate, filters.from, filters.to)) return false;
      return true;
    });
  }, [shipments, filters]);

  const counts = useMemo(() => Object.fromEntries(TAB_KEYS.map((k) => [k, shipments.filter((s) => matchesStatus(s, k)).length])), [shipments]);

  const openForm = (s) => {
    setEditing(s);
    setFormOpen(true);
  };

  const renderActions = (s) => {
    const done = s.status === "delivered" || s.status === "cancelled";
    return (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {!done && (
          <Button variant="ghost" size="icon" onClick={() => setStatusFor(s)} title="Update status" aria-label={`Update status of ${s.id}`}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {!done && (
          <Button variant="ghost" size="icon" onClick={() => openForm(s)} title="Edit" aria-label={`Edit ${s.id}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {!isLiveShipment(s) && (
          <Button variant="ghost" size="icon" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(s)} title="Delete" aria-label={`Delete ${s.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const columns = [
    {
      key: "id",
      header: "Shipment",
      sortValue: (s) => s.id,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.id}</p>
          <p className="max-w-[160px] truncate text-xs text-slate-500">{s.cargo}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (s) => s.customer.company,
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{s.customer.company}</p>
          <p className="truncate text-xs text-slate-500">{s.customer.name}</p>
        </div>
      ),
    },
    { key: "route", header: "Route", sortValue: (s) => s.pickup.city, render: (s) => <RouteLabel from={s.pickup.city} to={s.delivery.city} /> },
    {
      key: "assigned",
      header: "Driver / Vehicle",
      hideBelow: "lg",
      render: (s) => {
        const d = s.driverId ? driverById.get(s.driverId) : undefined;
        const v = s.vehicleId ? vehicleById.get(s.vehicleId) : undefined;
        return d || v ? (
          <div className="text-sm">
            <p className="text-slate-800">{d?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">{v?.plateNumber ?? "No vehicle"}</p>
          </div>
        ) : (
          <span className="text-sm italic text-slate-400">Unassigned</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (s) => s.status,
      render: (s) => (
        <div className="w-28 space-y-1.5">
          <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
          {isLiveShipment(s) && <ProgressBar value={s.progress} color={SHIPMENT_STATUS[s.status].color} size="sm" />}
        </div>
      ),
    },
    {
      key: "eta",
      header: "ETA",
      sortValue: (s) => s.eta,
      render: (s) => (
        <div className="text-sm">
          <p className={cn("text-slate-700", s.status === "delayed" && "font-medium text-rose-600")}>{formatDateTime(s.deliveredAt ?? s.eta)}</p>
          <p className="text-xs text-slate-400">{s.deliveredAt ? "delivered" : timeAgo(s.eta)}</p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      hideBelow: "xl",
      sortValue: (s) => ["low", "normal", "high", "urgent"].indexOf(s.priority),
      render: (s) => <Badge tone={PRIORITY[s.priority].tone}>{PRIORITY[s.priority].label}</Badge>,
    },
    { key: "actions", header: "", className: "text-right", render: renderActions },
  ];

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Create, assign and track every shipment end-to-end."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New shipment
          </Button>
        }
      />

      <Tabs className="mb-4" value={filters.status} onChange={(k) => setFilter("status", k)} items={TAB_KEYS.map((k) => ({ key: k, label: TAB_LABEL[k], count: counts[k] }))} />

      <Card>
        <FilterBar search={filters.q} onSearch={(v) => setFilter("q", v)} placeholder="Search ID, customer, cargo or city…" activeCount={activeCount} onClear={clear} resultCount={filtered.length}>
          <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter("priority", v)} options={Object.keys(PRIORITY).map((k) => ({ value: k, label: PRIORITY[k].label }))} />
          <FilterSelect label="Driver" value={filters.driver} onChange={(v) => setFilter("driver", v)} options={[{ value: "none", label: "Unassigned" }, ...drivers.map((d) => ({ value: d.id, label: d.name }))]} />
          <FilterSelect label="Vehicle" value={filters.vehicle} onChange={(v) => setFilter("vehicle", v)} options={[{ value: "none", label: "Unassigned" }, ...vehicles.map((v) => ({ value: v.id, label: v.plateNumber }))]} />
          <FilterSelect label="Location" value={filters.city} onChange={(v) => setFilter("city", v)} options={CITY_NAMES.map((c) => ({ value: c, label: c }))} />
          <FilterDate label="Pickup from" value={filters.from} onChange={(v) => setFilter("from", v)} />
          <FilterDate label="Pickup to" value={filters.to} onChange={(v) => setFilter("to", v)} />
        </FilterBar>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.id}
          onRowClick={(s) => navigate(`/shipments/${s.id}`)}
          initialSort={{ key: "id", dir: "desc" }}
          empty={
            shipments.length === 0 ? (
              <EmptyState icon={<Package className="h-7 w-7" />} title="No shipments yet" description="Create your first shipment to get started." action={<Button onClick={() => openForm(null)}>New shipment</Button>} />
            ) : (
              <EmptyState
                title="No shipments match your filters"
                description="Try a different status, date range or location."
                action={
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                }
              />
            )
          }
          mobileCard={(s) => {
            const d = s.driverId ? driverById.get(s.driverId) : undefined;
            return (
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{s.id}</p>
                    <p className="truncate text-xs text-slate-500">{s.customer.company}</p>
                  </div>
                  <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                </div>
                <RouteLabel from={s.pickup.city} to={s.delivery.city} />
                {isLiveShipment(s) && <ProgressBar value={s.progress} color={SHIPMENT_STATUS[s.status].color} size="sm" />}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {d?.name ?? "Unassigned"} · ETA {formatDateTime(s.eta)}
                  </span>
                  {renderActions(s)}
                </div>
              </div>
            );
          }}
        />
      </Card>

      <ShipmentFormModal open={formOpen} onClose={() => setFormOpen(false)} shipment={editing} />
      <StatusUpdateModal shipment={statusFor} open={!!statusFor} onClose={() => setStatusFor(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteShipment(deleting.id)}
        title="Delete shipment?"
        message={`${deleting?.id} for ${deleting?.customer.company} will be permanently deleted along with its history.`}
        confirmLabel="Delete shipment"
      />
    </>
  );
}

export default function ShipmentsPage() {
  useDocumentTitle("Shipments");
  return (
    <DataBoundary>
      <ShipmentsContent />
    </DataBoundary>
  );
}

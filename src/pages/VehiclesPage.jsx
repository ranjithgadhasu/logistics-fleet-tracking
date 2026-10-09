import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { FilterBar, FilterDate, FilterSelect } from "@/components/filters/FilterBar";
import { Avatar, Button, Card, ConfirmDialog, DataBoundary, DataTable, EmptyState, PageHeader, ProgressBar, StatusBadge, Tabs } from "@/components/ui";
import { CITY_NAMES, VEHICLE_STATUS, VEHICLE_TYPES } from "@/constants";
import { ServiceBadge } from "@/features/vehicles/ServiceBadge";
import { VehicleFormModal } from "@/features/vehicles/VehicleFormModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useFleetStore } from "@/store/fleetStore";
import { serviceState, useLookups } from "@/store/selectors";
import { formatKm, isWithinRange } from "@/utils/format";

const DEFAULTS = { q: "", status: "", type: "", city: "", service: "", assignment: "", from: "", to: "" };

function VehiclesContent() {
  const navigate = useNavigate();
  const vehicles = useFleetStore((s) => s.vehicles);
  const deleteVehicle = useFleetStore((s) => s.deleteVehicle);
  const { driverById } = useLookups();
  const { filters, setFilter, clear, activeCount } = useUrlFilters(DEFAULTS);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return vehicles.filter((v) => {
      const driver = v.driverId ? driverById.get(v.driverId) : undefined;
      if (q && ![v.plateNumber, v.make, v.model, v.id, driver?.name ?? ""].some((x) => x.toLowerCase().includes(q))) return false;
      if (filters.status && v.status !== filters.status) return false;
      if (filters.type && v.type !== filters.type) return false;
      if (filters.city && v.city !== filters.city) return false;
      if (filters.service && serviceState(v) !== filters.service) return false;
      if (filters.assignment === "assigned" && !v.driverId) return false;
      if (filters.assignment === "unassigned" && v.driverId) return false;
      if ((filters.from || filters.to) && !isWithinRange(v.nextServiceDate, filters.from, filters.to)) return false;
      return true;
    });
  }, [vehicles, filters, driverById]);

  const counts = useMemo(() => {
    const c = { "": vehicles.length };
    vehicles.forEach((v) => (c[v.status] = (c[v.status] ?? 0) + 1));
    return c;
  }, [vehicles]);

  const openEdit = (v) => {
    setEditing(v);
    setFormOpen(true);
  };

  const columns = [
    {
      key: "vehicle",
      header: "Vehicle",
      sortValue: (v) => v.plateNumber,
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{v.plateNumber}</p>
            <p className="truncate text-xs text-slate-500">
              {v.make} {v.model} · {v.type}
            </p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", sortValue: (v) => v.status, render: (v) => <StatusBadge meta={VEHICLE_STATUS[v.status]} /> },
    {
      key: "driver",
      header: "Driver",
      sortValue: (v) => (v.driverId ? driverById.get(v.driverId)?.name ?? "" : "~"),
      render: (v) => {
        const d = v.driverId ? driverById.get(v.driverId) : undefined;
        return d ? (
          <div className="flex items-center gap-2">
            <Avatar name={d.name} size="sm" />
            <span className="text-sm text-slate-700">{d.name}</span>
          </div>
        ) : (
          <span className="text-sm italic text-slate-400">Unassigned</span>
        );
      },
    },
    { key: "city", header: "Location", sortValue: (v) => v.city, render: (v) => <span className="text-sm text-slate-600">{v.city}</span>, hideBelow: "lg" },
    {
      key: "fuel",
      header: "Fuel",
      sortValue: (v) => v.fuelLevel,
      render: (v) => (
        <div className="w-24">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-500">{v.fuelType === "Electric" ? "Charge" : "Fuel"}</span>
            <span className="font-semibold text-slate-700">{Math.round(v.fuelLevel)}%</span>
          </div>
          <ProgressBar value={v.fuelLevel} size="sm" />
        </div>
      ),
    },
    { key: "service", header: "Next service", sortValue: (v) => v.nextServiceDate, render: (v) => <ServiceBadge vehicle={v} /> },
    { key: "mileage", header: "Odometer", sortValue: (v) => v.mileage, render: (v) => <span className="text-sm text-slate-600">{formatKm(v.mileage)}</span>, hideBelow: "xl" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (v) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEdit(v)} aria-label={`Edit ${v.plateNumber}`}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleting(v)} aria-label={`Delete ${v.plateNumber}`} className="hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const statusTabs = [{ key: "", label: "All", count: counts[""] }, ...Object.keys(VEHICLE_STATUS).map((k) => ({ key: k, label: VEHICLE_STATUS[k].label, count: counts[k] ?? 0 }))];

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Manage your fleet, assignments, fuel and maintenance."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openEdit(null)}>
            Add vehicle
          </Button>
        }
      />

      <Tabs items={statusTabs} value={filters.status} onChange={(k) => setFilter("status", k)} className="mb-4" />

      <Card>
        <FilterBar search={filters.q} onSearch={(v) => setFilter("q", v)} placeholder="Search plate, make, model or driver…" activeCount={activeCount} onClear={clear} resultCount={filtered.length}>
          <FilterSelect label="Type" value={filters.type} onChange={(v) => setFilter("type", v)} options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))} />
          <FilterSelect label="Location" value={filters.city} onChange={(v) => setFilter("city", v)} options={CITY_NAMES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect
            label="Maintenance"
            value={filters.service}
            onChange={(v) => setFilter("service", v)}
            options={[
              { value: "overdue", label: "Overdue" },
              { value: "due-soon", label: "Due soon" },
              { value: "ok", label: "Up to date" },
            ]}
          />
          <FilterSelect
            label="Driver"
            value={filters.assignment}
            onChange={(v) => setFilter("assignment", v)}
            options={[
              { value: "assigned", label: "Assigned" },
              { value: "unassigned", label: "Unassigned" },
            ]}
          />
          <FilterDate label="Service from" value={filters.from} onChange={(v) => setFilter("from", v)} />
          <FilterDate label="Service to" value={filters.to} onChange={(v) => setFilter("to", v)} />
        </FilterBar>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(v) => v.id}
          onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
          initialSort={{ key: "vehicle", dir: "asc" }}
          empty={
            vehicles.length === 0 ? (
              <EmptyState icon={<Truck className="h-7 w-7" />} title="No vehicles yet" description="Add your first vehicle to start tracking your fleet." action={<Button onClick={() => openEdit(null)}>Add vehicle</Button>} />
            ) : (
              <EmptyState
                title="No vehicles match your filters"
                description="Try adjusting or clearing the filters."
                action={
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                }
              />
            )
          }
          mobileCard={(v) => {
            const d = v.driverId ? driverById.get(v.driverId) : undefined;
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{v.plateNumber}</p>
                      <p className="text-xs text-slate-500">
                        {v.make} {v.model} · {v.city}
                      </p>
                    </div>
                  </div>
                  <StatusBadge meta={VEHICLE_STATUS[v.status]} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Driver</p>
                    <p className="font-medium text-slate-800">{d?.name ?? "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-500">Fuel {Math.round(v.fuelLevel)}%</p>
                    <ProgressBar value={v.fuelLevel} size="sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <ServiceBadge vehicle={v} />
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEdit(v)} icon={<Pencil className="h-3.5 w-3.5" />}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleting(v)} className="text-rose-600" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </Card>

      <VehicleFormModal open={formOpen} onClose={() => setFormOpen(false)} vehicle={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteVehicle(deleting.id)}
        title="Remove vehicle?"
        message={`${deleting?.plateNumber} (${deleting?.make} ${deleting?.model}) will be permanently removed and its driver unassigned. This can't be undone.`}
        confirmLabel="Remove vehicle"
      />
    </>
  );
}

export default function VehiclesPage() {
  useDocumentTitle("Vehicles");
  return (
    <DataBoundary>
      <VehiclesContent />
    </DataBoundary>
  );
}

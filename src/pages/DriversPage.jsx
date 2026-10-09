import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Pencil, Phone, Plus, Star, Trash2, Truck, Users } from "lucide-react";
import { FilterBar, FilterDate, FilterSelect } from "@/components/filters/FilterBar";
import { Avatar, Button, Card, ConfirmDialog, DataBoundary, EmptyState, PageHeader, Pagination, StatusBadge, Tabs } from "@/components/ui";
import { CITY_NAMES, DRIVER_STATUS } from "@/constants";
import { DriverFormModal } from "@/features/drivers/DriverFormModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePagination } from "@/hooks/usePagination";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useFleetStore } from "@/store/fleetStore";
import { getDriverMetrics, useLookups } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { isWithinRange } from "@/utils/format";

const DEFAULTS = { q: "", status: "", city: "", vehicle: "", performance: "", from: "", to: "", sort: "score" };

const SORTERS = {
  score: (a, b) => b.metrics.score - a.metrics.score,
  name: (a, b) => a.driver.name.localeCompare(b.driver.name),
  rating: (a, b) => b.driver.rating - a.driver.rating,
  deliveries: (a, b) => b.metrics.delivered - a.metrics.delivered,
};

function DriversContent() {
  const drivers = useFleetStore((s) => s.drivers);
  const shipments = useFleetStore((s) => s.shipments);
  const deleteDriver = useFleetStore((s) => s.deleteDriver);
  const { vehicleById } = useLookups();
  const { filters, setFilter, clear, activeCount } = useUrlFilters(DEFAULTS);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const withMetrics = useMemo(() => drivers.map((d) => ({ driver: d, metrics: getDriverMetrics(d, shipments) })), [drivers, shipments]);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    const list = withMetrics.filter(({ driver: d, metrics: m }) => {
      if (q && ![d.name, d.email, d.id, d.phone, d.licenseNumber].some((x) => x.toLowerCase().includes(q))) return false;
      if (filters.status && d.status !== filters.status) return false;
      if (filters.city && d.city !== filters.city) return false;
      if (filters.vehicle === "assigned" && !d.vehicleId) return false;
      if (filters.vehicle === "unassigned" && d.vehicleId) return false;
      if (filters.performance === "top" && m.score < 85) return false;
      if (filters.performance === "attention" && m.score >= 70) return false;
      if ((filters.from || filters.to) && !isWithinRange(d.joinedAt, filters.from, filters.to)) return false;
      return true;
    });
    return [...list].sort(SORTERS[filters.sort] ?? SORTERS.score);
  }, [withMetrics, filters]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(filtered, 9);

  const counts = useMemo(() => {
    const c = { "": drivers.length };
    drivers.forEach((d) => (c[d.status] = (c[d.status] ?? 0) + 1));
    return c;
  }, [drivers]);

  const openForm = (d) => {
    setEditing(d);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Profiles, availability, vehicle assignments and performance."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            Add driver
          </Button>
        }
      />

      <Tabs
        className="mb-4"
        value={filters.status}
        onChange={(k) => setFilter("status", k)}
        items={[{ key: "", label: "All", count: counts[""] }, ...Object.keys(DRIVER_STATUS).map((k) => ({ key: k, label: DRIVER_STATUS[k].label, count: counts[k] ?? 0 }))]}
      />

      <Card className="mb-4">
        <FilterBar search={filters.q} onSearch={(v) => setFilter("q", v)} placeholder="Search name, email, phone or license…" activeCount={activeCount} onClear={clear} resultCount={filtered.length}>
          <FilterSelect label="Location" value={filters.city} onChange={(v) => setFilter("city", v)} options={CITY_NAMES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect
            label="Vehicle"
            value={filters.vehicle}
            onChange={(v) => setFilter("vehicle", v)}
            options={[
              { value: "assigned", label: "Has vehicle" },
              { value: "unassigned", label: "No vehicle" },
            ]}
          />
          <FilterSelect
            label="Performance"
            value={filters.performance}
            onChange={(v) => setFilter("performance", v)}
            options={[
              { value: "top", label: "Top performers" },
              { value: "attention", label: "Needs attention" },
            ]}
          />
          <FilterDate label="Joined from" value={filters.from} onChange={(v) => setFilter("from", v)} />
          <FilterDate label="Joined to" value={filters.to} onChange={(v) => setFilter("to", v)} />
          <FilterSelect
            label="Sort by"
            allLabel="Score"
            value={filters.sort === "score" ? "" : filters.sort}
            onChange={(v) => setFilter("sort", v || "score")}
            options={[
              { value: "name", label: "Name" },
              { value: "rating", label: "Rating" },
              { value: "deliveries", label: "Deliveries" },
            ]}
          />
        </FilterBar>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          {drivers.length === 0 ? (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No drivers yet" description="Add drivers to start assigning vehicles and deliveries." action={<Button onClick={() => openForm(null)}>Add driver</Button>} />
          ) : (
            <EmptyState
              title="No drivers match your filters"
              action={
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map(({ driver: d, metrics: m }) => {
              const v = d.vehicleId ? vehicleById.get(d.vehicleId) : undefined;
              return (
                <Card key={d.id} className="group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link to={`/drivers/${d.id}`} className="flex-1 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={d.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-600">{d.name}</p>
                          <StatusBadge meta={DRIVER_STATUS[d.status]} />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {d.city} · {d.experienceYears} yrs exp.
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" /> {d.phone}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                      <div>
                        <p className="text-base font-bold text-slate-900">{m.delivered}</p>
                        <p className="text-[11px] text-slate-500">Deliveries</p>
                      </div>
                      <div>
                        <p className={cn("text-base font-bold", m.onTimeRate >= 85 ? "text-emerald-600" : m.onTimeRate >= 70 ? "text-amber-600" : "text-rose-600")}>
                          {m.delivered ? `${m.onTimeRate}%` : "—"}
                        </p>
                        <p className="text-[11px] text-slate-500">On time</p>
                      </div>
                      <div>
                        <p className="flex items-center justify-center gap-0.5 text-base font-bold text-slate-900">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {d.rating.toFixed(1)}
                        </p>
                        <p className="text-[11px] text-slate-500">Rating</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-slate-400" />
                      {v ? (
                        <span className="text-slate-700">
                          {v.plateNumber}{" "}
                          <span className="text-slate-400">
                            · {v.make} {v.model}
                          </span>
                        </span>
                      ) : (
                        <span className="italic text-slate-400">No vehicle assigned</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <span className="text-xs text-slate-500">
                      Score <span className="font-bold text-slate-900">{m.score}</span>/100
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openForm(d)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(d)} aria-label={`Remove ${d.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
          </Card>
        </>
      )}

      <DriverFormModal open={formOpen} onClose={() => setFormOpen(false)} driver={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteDriver(deleting.id)}
        title="Remove driver?"
        message={`${deleting?.name} will be removed from the roster and unassigned from any vehicle.`}
        confirmLabel="Remove driver"
      />
    </>
  );
}

export default function DriversPage() {
  useDocumentTitle("Drivers");
  return (
    <DataBoundary>
      <DriversContent />
    </DataBoundary>
  );
}

import { useMemo, useState } from "react";
import { AlertOctagon, Bell, BellOff, CheckCheck, Clock, Trash2, Wrench } from "lucide-react";
import { FilterBar, FilterDate, FilterSelect } from "@/components/filters/FilterBar";
import { Button, Card, ConfirmDialog, DataBoundary, EmptyState, PageHeader, Pagination, StatCard, Tabs } from "@/components/ui";
import { NOTIFICATION_TYPE, SEVERITY } from "@/constants";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePagination } from "@/hooks/usePagination";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useFleetStore } from "@/store/fleetStore";
import { isWithinRange } from "@/utils/format";

const DEFAULTS = { q: "", type: "", severity: "", read: "", from: "", to: "" };

function NotificationsContent() {
  const notifications = useFleetStore((s) => s.notifications);
  const markAll = useFleetStore((s) => s.markAllNotificationsRead);
  const clearAll = useFleetStore((s) => s.clearNotifications);
  const { filters, setFilter, clear, activeCount } = useUrlFilters(DEFAULTS);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return notifications.filter((n) => {
      if (q && !`${n.title} ${n.message}`.toLowerCase().includes(q)) return false;
      if (filters.type && n.type !== filters.type) return false;
      if (filters.severity && n.severity !== filters.severity) return false;
      if (filters.read === "unread" && n.read) return false;
      if (filters.read === "read" && !n.read) return false;
      if ((filters.from || filters.to) && !isWithinRange(n.createdAt, filters.from, filters.to)) return false;
      return true;
    });
  }, [notifications, filters]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(filtered, 12);

  const unread = notifications.filter((n) => !n.read).length;
  const critical = notifications.filter((n) => n.severity === "critical" && !n.read).length;
  const countType = (t) => notifications.filter((n) => n.type === t).length;

  return (
    <>
      <PageHeader
        title="Notifications & alerts"
        description="Delays, maintenance, delivery updates and driver status changes."
        actions={
          <>
            <Button variant="outline" icon={<CheckCheck className="h-4 w-4" />} onClick={() => markAll().catch(() => undefined)} disabled={unread === 0}>
              Mark all read
            </Button>
            <Button variant="outline" className="text-rose-600 hover:bg-rose-50" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmClear(true)} disabled={notifications.length === 0}>
              Clear all
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Unread" value={unread} icon={<Bell className="h-5 w-5" />} accent="indigo" onClick={() => setFilter("read", "unread")} />
        <StatCard label="Critical" value={critical} icon={<AlertOctagon className="h-5 w-5" />} accent="rose" hint="unread" onClick={() => setFilter("severity", "critical")} />
        <StatCard label="Delay alerts" value={countType("delay")} icon={<Clock className="h-5 w-5" />} accent="amber" onClick={() => setFilter("type", "delay")} />
        <StatCard label="Maintenance" value={countType("maintenance")} icon={<Wrench className="h-5 w-5" />} accent="sky" onClick={() => setFilter("type", "maintenance")} />
      </section>

      <Tabs
        className="mb-4"
        value={filters.type}
        onChange={(k) => setFilter("type", k)}
        items={[{ key: "", label: "All", count: notifications.length }, ...Object.keys(NOTIFICATION_TYPE).map((k) => ({ key: k, label: NOTIFICATION_TYPE[k], count: countType(k) }))]}
      />

      <Card>
        <FilterBar search={filters.q} onSearch={(v) => setFilter("q", v)} placeholder="Search notifications…" activeCount={activeCount} onClear={clear} resultCount={filtered.length}>
          <FilterSelect label="Severity" value={filters.severity} onChange={(v) => setFilter("severity", v)} options={Object.keys(SEVERITY).map((k) => ({ value: k, label: SEVERITY[k].label }))} />
          <FilterSelect
            label="Status"
            value={filters.read}
            onChange={(v) => setFilter("read", v)}
            options={[
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ]}
          />
          <FilterDate label="From" value={filters.from} onChange={(v) => setFilter("from", v)} />
          <FilterDate label="To" value={filters.to} onChange={(v) => setFilter("to", v)} />
        </FilterBar>

        {filtered.length === 0 ? (
          notifications.length === 0 ? (
            <EmptyState icon={<BellOff className="h-7 w-7" />} title="No notifications" description="You're all caught up. New alerts will appear here automatically." />
          ) : (
            <EmptyState
              title="Nothing matches these filters"
              action={
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {pageItems.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => clearAll()}
        title="Clear all notifications?"
        message="All notifications will be permanently removed. New alerts will continue to arrive."
        confirmLabel="Clear all"
      />
    </>
  );
}

export default function NotificationsPage() {
  useDocumentTitle("Notifications");
  return (
    <DataBoundary>
      <NotificationsContent />
    </DataBoundary>
  );
}

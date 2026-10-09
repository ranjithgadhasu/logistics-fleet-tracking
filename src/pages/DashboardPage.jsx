import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Hourglass, Package, Plus, Timer, Truck, Users } from "lucide-react";
import { Button, Card, DataBoundary, PageHeader, StatCard } from "@/components/ui";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import { DeliveryTrendChart, ShipmentStatusChart } from "@/features/dashboard/Charts";
import { AlertsPanel, FleetPerformance, LiveMapCard, TopDrivers } from "@/features/dashboard/Panels";
import { ShipmentFormModal } from "@/features/shipments/ShipmentFormModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFleetStore } from "@/store/fleetStore";
import { useDashboardStats } from "@/store/selectors";
import { cn } from "@/utils/cn";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function DashboardContent() {
  const navigate = useNavigate();
  const stats = useDashboardStats();
  const activities = useFleetStore((s) => s.activities);
  const [creating, setCreating] = useState(false);

  const statusTiles = [
    { key: "delivered", label: "Delivered", value: stats.shipmentStatus.delivered, icon: CheckCircle2, cls: "from-emerald-500 to-teal-500" },
    { key: "in-transit", label: "In transit", value: stats.shipmentStatus.inTransit, icon: Truck, cls: "from-sky-500 to-indigo-500" },
    { key: "delayed", label: "Delayed", value: stats.shipmentStatus.delayed, icon: Clock, cls: "from-rose-500 to-orange-500" },
    { key: "active", label: "Pending / assigned", value: stats.shipmentStatus.pending, icon: Hourglass, cls: "from-violet-500 to-fuchsia-500" },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}, Alex 👋`}
        description={`Here's what's happening across your fleet · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New shipment
          </Button>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Key metrics">
        <StatCard label="Total vehicles" value={stats.totals.vehicles} icon={<Truck className="h-5 w-5" />} accent="indigo" hint={`${stats.totals.activeVehicles} on the road`} onClick={() => navigate("/vehicles")} />
        <StatCard label="Drivers" value={stats.totals.drivers} icon={<Users className="h-5 w-5" />} accent="violet" hint={`${stats.totals.availableDrivers} available now`} onClick={() => navigate("/drivers")} />
        <StatCard label="Active shipments" value={stats.totals.activeShipments} icon={<Package className="h-5 w-5" />} accent="sky" hint="pending, assigned & on the road" onClick={() => navigate("/shipments?status=active")} />
        <StatCard label="On-time rate" value={`${stats.onTimeRate}%`} icon={<Timer className="h-5 w-5" />} accent="emerald" hint={`${stats.lateCount} late of ${stats.deliveredCount}`} />
      </section>

      {/* Shipment status tiles */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Shipment status">
        {statusTiles.map((t) => (
          <button
            key={t.key}
            onClick={() => navigate(`/shipments?status=${t.key}`)}
            className={cn("group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5", t.cls)}
          >
            <t.icon className="absolute -right-3 -top-3 h-20 w-20 opacity-15 transition group-hover:scale-110" />
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">{t.label}</p>
            <p className="mt-2 text-3xl font-bold">{t.value}</p>
            <p className="mt-1 text-xs text-white/80 group-hover:underline">View shipments →</p>
          </button>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <DeliveryTrendChart data={stats.trend} onTimeRate={stats.onTimeRate} />
        <ShipmentStatusChart counts={stats.shipmentStatus} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <FleetPerformance
          vehicleStatus={stats.vehicleStatus}
          utilization={stats.utilization}
          avgFuel={stats.avgFuel}
          serviceDue={stats.serviceDue}
          distance={stats.distance}
          total={stats.totals.vehicles}
        />
        <LiveMapCard />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TopDrivers items={stats.topDrivers} />
        <AlertsPanel />
        <Card className="md:col-span-2 xl:col-span-1">
          <div className="px-5 pt-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Recent activity</h3>
            <p className="mt-0.5 text-xs text-slate-500">Latest events across the platform</p>
          </div>
          <div className="thin-scrollbar max-h-[380px] overflow-y-auto p-5">
            <ActivityFeed items={activities} limit={10} />
          </div>
        </Card>
      </section>

      <ShipmentFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  return (
    <DataBoundary>
      <DashboardContent />
    </DataBoundary>
  );
}

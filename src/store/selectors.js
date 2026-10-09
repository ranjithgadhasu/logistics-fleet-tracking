import { useMemo } from "react";
import { SERVICE_WARNING_DAYS } from "@/constants";
import { daysUntil, percent } from "@/utils/format";
import { useFleetStore } from "./fleetStore";

/** O(1) lookups for joining entities in lists. */
export function useLookups() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  return useMemo(
    () => ({
      vehicleById: new Map(vehicles.map((v) => [v.id, v])),
      driverById: new Map(drivers.map((d) => [d.id, d])),
    }),
    [vehicles, drivers],
  );
}

export const isLiveShipment = (s) => s.status === "in-transit" || s.status === "delayed";
export const isActiveShipment = (s) => ["pending", "assigned", "in-transit", "delayed"].includes(s.status);

export function wasOnTime(s) {
  return !!s.deliveredAt && new Date(s.deliveredAt).getTime() <= new Date(s.eta).getTime();
}

/** @returns {"overdue" | "due-soon" | "ok"} */
export function serviceState(v) {
  const d = daysUntil(v.nextServiceDate);
  if (d < 0) return "overdue";
  if (d <= SERVICE_WARNING_DAYS) return "due-soon";
  return "ok";
}

export function getDriverMetrics(driver, shipments) {
  const mine = shipments.filter((s) => s.driverId === driver.id);
  const delivered = mine.filter((s) => s.status === "delivered");
  const onTime = delivered.filter(wasOnTime).length;
  const onTimeRate = percent(onTime, delivered.length);
  const distanceKm = delivered.reduce((sum, s) => sum + s.distanceKm, 0);
  // weighted score out of 100 — on-time matters most, rating second
  const score = delivered.length
    ? Math.round(onTimeRate * 0.6 + (driver.rating / 5) * 100 * 0.4)
    : Math.round((driver.rating / 5) * 100);
  return {
    total: mine.length,
    delivered: delivered.length,
    onTime,
    onTimeRate,
    late: delivered.length - onTime,
    active: mine.filter(isActiveShipment).length,
    distanceKm,
    score,
  };
}

/** Everything the dashboard needs, memoised on the source collections. */
export function useDashboardStats() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const shipments = useFleetStore((s) => s.shipments);

  return useMemo(() => {
    const byStatus = (st) => shipments.filter((s) => s.status === st).length;
    const delivered = shipments.filter((s) => s.status === "delivered");
    const onTime = delivered.filter(wasOnTime).length;

    // last 14 days delivery trend
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const trend = days.map((d) => {
      const next = d.getTime() + 86_400_000;
      const sameDay = delivered.filter((s) => {
        const t = new Date(s.deliveredAt).getTime();
        return t >= d.getTime() && t < next;
      });
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        onTime: sameDay.filter(wasOnTime).length,
        late: sameDay.filter((s) => !wasOnTime(s)).length,
      };
    });

    const vehicleStatus = ["active", "idle", "maintenance", "offline"].map((st) => ({
      status: st,
      count: vehicles.filter((v) => v.status === st).length,
    }));

    const avgFuel = vehicles.length ? Math.round(vehicles.reduce((s, v) => s + v.fuelLevel, 0) / vehicles.length) : 0;
    const utilization = percent(
      vehicles.filter((v) => v.status === "active").length,
      vehicles.filter((v) => v.status !== "offline").length,
    );
    const serviceDue = vehicles.filter((v) => serviceState(v) !== "ok").length;
    const distance = delivered.reduce((s, x) => s + x.distanceKm, 0);

    const topDrivers = drivers
      .map((d) => ({ driver: d, metrics: getDriverMetrics(d, shipments) }))
      .filter((x) => x.metrics.delivered > 0)
      .sort((a, b) => b.metrics.score - a.metrics.score)
      .slice(0, 5);

    return {
      totals: {
        vehicles: vehicles.length,
        drivers: drivers.length,
        activeShipments: shipments.filter(isActiveShipment).length,
        availableDrivers: drivers.filter((d) => d.status === "available").length,
        activeVehicles: vehicles.filter((v) => v.status === "active").length,
      },
      shipmentStatus: {
        delivered: byStatus("delivered"),
        inTransit: byStatus("in-transit"),
        delayed: byStatus("delayed"),
        pending: byStatus("pending") + byStatus("assigned"),
        cancelled: byStatus("cancelled"),
      },
      onTimeRate: percent(onTime, delivered.length),
      deliveredCount: delivered.length,
      lateCount: delivered.length - onTime,
      trend,
      vehicleStatus,
      avgFuel,
      utilization,
      serviceDue,
      distance,
      topDrivers,
    };
  }, [vehicles, drivers, shipments]);
}

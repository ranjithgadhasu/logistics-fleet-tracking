import { create } from "zustand";
import {
  activityService,
  driverService,
  getErrorMessage,
  notificationService,
  shipmentService,
  systemService,
  vehicleService,
} from "@/api";
import { toast } from "./uiStore";

async function loadEverything(silent) {
  const opts = { silent };
  const [vehicles, drivers, shipments, notifications, activities] = await Promise.all([
    vehicleService.list(opts),
    driverService.list(opts),
    shipmentService.list(opts),
    notificationService.list(opts),
    activityService.list(opts),
  ]);
  return { vehicles, drivers, shipments, notifications, activities };
}

/**
 * Global domain store.
 * status: "idle" | "loading" | "success" | "error"
 */
export const useFleetStore = create((set, get) => {
  /**
   * Runs a mutation, re-syncs related collections (the server may have
   * changed assignments / notifications as a side effect) and shows a toast.
   * Errors are surfaced as toasts and re-thrown so forms can stay open.
   */
  async function mutate(fn, successMsg) {
    try {
      const result = await fn();
      await get().refresh();
      if (successMsg) toast.success(successMsg);
      return result;
    } catch (err) {
      toast.error("Action failed", getErrorMessage(err));
      throw err;
    }
  }

  return {
    vehicles: [],
    drivers: [],
    shipments: [],
    notifications: [],
    activities: [],
    status: "idle",
    error: null,
    lastSyncedAt: null,

    async fetchAll() {
      set({ status: "loading", error: null });
      try {
        const data = await loadEverything(false);
        set({ ...data, status: "success", lastSyncedAt: new Date().toISOString() });
      } catch (err) {
        set({ status: "error", error: getErrorMessage(err) });
      }
    },

    async refresh() {
      const data = await loadEverything(true);
      set({ ...data, lastSyncedAt: new Date().toISOString() });
    },

    async tick() {
      if (get().status !== "success") return;
      await shipmentService.tick();
      await get().refresh();
    },

    async resetDemo() {
      await mutate(() => systemService.resetDemoData(), "Demo data restored");
    },

    /* vehicles */
    createVehicle: (input) => mutate(() => vehicleService.create(input), `Vehicle ${input.plateNumber} added`),
    updateVehicle: (id, patch) => mutate(() => vehicleService.update(id, patch), "Vehicle updated"),
    deleteVehicle: async (id) => {
      await mutate(() => vehicleService.remove(id), "Vehicle removed");
    },
    assignDriver: async (vehicleId, driverId) => {
      await mutate(() => vehicleService.assignDriver(vehicleId, driverId), driverId ? "Driver assigned" : "Driver unassigned");
    },

    /* drivers */
    createDriver: (input) => mutate(() => driverService.create(input), `${input.name} added to drivers`),
    updateDriver: (id, patch) => mutate(() => driverService.update(id, patch), "Driver updated"),
    deleteDriver: async (id) => {
      await mutate(() => driverService.remove(id), "Driver removed");
    },

    /* shipments */
    createShipment: (input) => mutate(() => shipmentService.create(input), "Shipment created"),
    updateShipment: (id, input) => mutate(() => shipmentService.update(id, input), "Shipment updated"),
    updateShipmentStatus: (id, status, note) => mutate(() => shipmentService.updateStatus(id, status, note), "Shipment status updated"),
    deleteShipment: async (id) => {
      await mutate(() => shipmentService.remove(id), "Shipment deleted");
    },

    /* notifications */
    markNotificationRead: async (id) => {
      // optimistic update – feels instant
      set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) });
      await notificationService.markRead(id).catch(() => get().refresh());
    },
    markAllNotificationsRead: async () => {
      await mutate(() => notificationService.markAllRead(), "All notifications marked as read");
    },
    deleteNotification: async (id) => {
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
      await notificationService.remove(id).catch(() => get().refresh());
    },
    clearNotifications: async () => {
      await mutate(() => notificationService.clear(), "Notifications cleared");
    },
  };
});

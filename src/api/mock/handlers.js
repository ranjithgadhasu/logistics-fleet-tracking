/**
 * Mock "server" handlers.
 *
 * Everything here is what a real backend would be responsible for:
 * id generation, keeping driver <-> vehicle assignments consistent,
 * recording activity and raising notifications. The UI never mutates data directly.
 */
import { findCity, LOW_FUEL_THRESHOLD, SHIPMENT_STATUS } from "@/constants";
import { pointOnRoute, roadDistanceKm } from "@/utils/geo";
import { ApiError } from "../client";
import { commit, getDb } from "./db";

const nowIso = () => new Date().toISOString();
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function nextNumericId(items, prefix, start) {
  const max = items.reduce((m, it) => {
    const n = Number(it.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, start);
  return `${prefix}-${max + 1}`;
}

function logActivity(a) {
  const db = getDb();
  db.activities.unshift({ id: uid("ACT"), date: nowIso(), ...a });
  db.activities = db.activities.slice(0, 400);
}

function notify(n) {
  const db = getDb();
  db.notifications.unshift({ id: uid("NT"), read: false, createdAt: nowIso(), ...n });
  db.notifications = db.notifications.slice(0, 200);
}

function findVehicle(id) {
  const v = getDb().vehicles.find((x) => x.id === id);
  if (!v) throw new ApiError(`Vehicle ${id} not found`, 404);
  return v;
}
function findDriver(id) {
  const d = getDb().drivers.find((x) => x.id === id);
  if (!d) throw new ApiError(`Driver ${id} not found`, 404);
  return d;
}
function findShipment(id) {
  const s = getDb().shipments.find((x) => x.id === id);
  if (!s) throw new ApiError(`Shipment ${id} not found`, 404);
  return s;
}

const isLive = (s) => s.status === "in-transit" || s.status === "delayed";

/** Keeps both sides of the vehicle <-> driver relationship in sync. */
function assignPair(vehicleId, driverId) {
  const db = getDb();
  const vehicle = findVehicle(vehicleId);
  if (vehicle.driverId === driverId) return;

  if (vehicle.driverId) {
    const prev = db.drivers.find((d) => d.id === vehicle.driverId);
    if (prev) prev.vehicleId = null;
  }
  if (driverId) {
    const driver = findDriver(driverId);
    if (driver.vehicleId && driver.vehicleId !== vehicleId) {
      const other = db.vehicles.find((v) => v.id === driver.vehicleId);
      if (other) other.driverId = null;
    }
    driver.vehicleId = vehicleId;
    vehicle.driverId = driverId;
    logActivity({ entityType: "vehicle", entityId: vehicleId, kind: "assignment", message: `${driver.name} assigned as primary driver` });
    logActivity({ entityType: "driver", entityId: driverId, kind: "assignment", message: `Assigned to vehicle ${vehicle.plateNumber}` });
  } else {
    vehicle.driverId = null;
    logActivity({ entityType: "vehicle", entityId: vehicleId, kind: "assignment", message: "Driver unassigned" });
  }
}

function assertUniquePlate(plate, ignoreId) {
  const clash = getDb().vehicles.find((v) => v.plateNumber.toLowerCase() === plate.toLowerCase() && v.id !== ignoreId);
  if (clash) throw new ApiError(`A vehicle with plate ${plate} already exists`, 409);
}

/* -------------------------------- Vehicles ------------------------------- */

export const vehicleHandlers = {
  list: () => getDb().vehicles,

  create(input) {
    assertUniquePlate(input.plateNumber);
    const db = getDb();
    const city = findCity(input.city);
    const vehicle = {
      ...input,
      driverId: null,
      id: nextNumericId(db.vehicles, "VH", 200),
      location: { lat: city?.lat ?? 39.5, lng: city?.lng ?? -98.35 },
      speed: 0,
      createdAt: nowIso(),
    };
    db.vehicles.unshift(vehicle);
    logActivity({ entityType: "vehicle", entityId: vehicle.id, kind: "created", message: `Vehicle ${vehicle.plateNumber} added to the fleet` });
    if (input.driverId) assignPair(vehicle.id, input.driverId);
    commit();
    return vehicle;
  },

  update(id, patch) {
    const v = findVehicle(id);
    if (patch.plateNumber) assertUniquePlate(patch.plateNumber, id);
    const prevStatus = v.status;
    const prevService = v.lastServiceDate;
    const { driverId, ...rest } = patch;
    Object.assign(v, rest);

    if (patch.city && v.status !== "active") {
      const c = findCity(patch.city);
      if (c) v.location = { lat: c.lat, lng: c.lng };
    }
    if (driverId !== undefined) assignPair(id, driverId);

    if (patch.status && patch.status !== prevStatus) {
      logActivity({ entityType: "vehicle", entityId: id, kind: "status", message: `Status changed from ${prevStatus} to ${patch.status}` });
      if (patch.status === "maintenance") {
        notify({ type: "maintenance", severity: "warning", title: `${v.plateNumber} sent to maintenance`, message: `${v.make} ${v.model} is unavailable while in the workshop.`, link: `/vehicles/${id}` });
      }
      if (patch.status !== "active") v.speed = 0;
    }
    if (patch.lastServiceDate && patch.lastServiceDate !== prevService) {
      logActivity({ entityType: "vehicle", entityId: id, kind: "maintenance", message: "Service record updated" });
    }
    if (rest.make || rest.model || rest.fuelLevel !== undefined) {
      logActivity({ entityType: "vehicle", entityId: id, kind: "updated", message: "Vehicle details updated" });
    }
    commit();
    return v;
  },

  remove(id) {
    const db = getDb();
    const v = findVehicle(id);
    if (db.shipments.some((s) => s.vehicleId === id && isLive(s))) {
      throw new ApiError("This vehicle is on an active shipment and can't be removed.", 409);
    }
    if (v.driverId) assignPair(id, null);
    db.shipments.forEach((s) => {
      if (s.vehicleId === id && (s.status === "pending" || s.status === "assigned")) {
        s.vehicleId = null;
        s.status = "pending";
      }
    });
    db.vehicles = db.vehicles.filter((x) => x.id !== id);
    notify({ type: "system", severity: "info", title: "Vehicle removed", message: `${v.plateNumber} (${v.make} ${v.model}) was removed from the fleet.` });
    commit();
    return { id };
  },

  assignDriver(id, driverId) {
    assignPair(id, driverId);
    commit();
    return findVehicle(id);
  },
};

/* --------------------------------- Drivers ------------------------------- */

export const driverHandlers = {
  list: () => getDb().drivers,

  create(input) {
    const db = getDb();
    if (db.drivers.some((d) => d.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiError("A driver with this email already exists", 409);
    }
    const driver = {
      ...input,
      vehicleId: null,
      rating: input.rating ?? 4.5,
      id: nextNumericId(db.drivers, "DRV", 100),
      joinedAt: nowIso(),
    };
    db.drivers.unshift(driver);
    logActivity({ entityType: "driver", entityId: driver.id, kind: "created", message: `${driver.name} joined the team` });
    notify({ type: "driver", severity: "info", title: "New driver onboarded", message: `${driver.name} was added to the driver roster.`, link: `/drivers/${driver.id}` });
    if (input.vehicleId) assignPair(input.vehicleId, driver.id);
    commit();
    return driver;
  },

  update(id, patch) {
    const db = getDb();
    const d = findDriver(id);
    if (patch.email && db.drivers.some((x) => x.id !== id && x.email.toLowerCase() === patch.email.toLowerCase())) {
      throw new ApiError("A driver with this email already exists", 409);
    }
    const prevStatus = d.status;
    const { vehicleId, ...rest } = patch;
    Object.assign(d, rest);

    if (vehicleId !== undefined && vehicleId !== d.vehicleId) {
      if (vehicleId) assignPair(vehicleId, id);
      else if (d.vehicleId) assignPair(d.vehicleId, null);
    }
    if (patch.status && patch.status !== prevStatus) {
      logActivity({ entityType: "driver", entityId: id, kind: "status", message: `Status changed to ${patch.status}` });
      notify({
        type: "driver",
        severity: patch.status === "on-leave" ? "warning" : "info",
        title: `${d.name} is now ${patch.status.replace("-", " ")}`,
        message: `Driver availability updated from ${prevStatus.replace("-", " ")}.`,
        link: `/drivers/${id}`,
      });
    }
    commit();
    return d;
  },

  remove(id) {
    const db = getDb();
    const d = findDriver(id);
    if (db.shipments.some((s) => s.driverId === id && isLive(s))) {
      throw new ApiError("This driver is on an active delivery and can't be removed.", 409);
    }
    if (d.vehicleId) assignPair(d.vehicleId, null);
    db.shipments.forEach((s) => {
      if (s.driverId === id && (s.status === "pending" || s.status === "assigned")) {
        s.driverId = null;
        s.status = "pending";
      }
    });
    db.drivers = db.drivers.filter((x) => x.id !== id);
    notify({ type: "driver", severity: "info", title: "Driver removed", message: `${d.name} was removed from the roster.` });
    commit();
    return { id };
  },
};

/* -------------------------------- Shipments ------------------------------ */

function applyStatus(s, status, note) {
  const db = getDb();
  const prev = s.status;
  s.status = status;
  s.history.push({
    id: uid("EV"),
    status,
    note: note?.trim() || `Status changed to ${SHIPMENT_STATUS[status].label.toLowerCase()}`,
    date: nowIso(),
    city: status === "delivered" ? s.delivery.city : status === "in-transit" && prev !== "delayed" ? s.pickup.city : undefined,
  });

  const vehicle = s.vehicleId ? db.vehicles.find((v) => v.id === s.vehicleId) : undefined;
  const driver = s.driverId ? db.drivers.find((d) => d.id === s.driverId) : undefined;

  switch (status) {
    case "in-transit":
      s.progress = Math.max(s.progress, 1);
      if (vehicle) {
        vehicle.status = "active";
        vehicle.speed = 60;
        vehicle.location = pointOnRoute(s.pickup, s.delivery, s.progress);
      }
      if (driver) driver.status = "on-duty";
      if (prev !== "delayed") notify({ type: "delivery", severity: "info", title: `${s.id} picked up`, message: `On the way from ${s.pickup.city} to ${s.delivery.city}.`, link: `/shipments/${s.id}` });
      break;
    case "delivered":
      s.progress = 100;
      s.deliveredAt = nowIso();
      if (vehicle) {
        vehicle.status = "idle";
        vehicle.speed = 0;
        vehicle.city = s.delivery.city;
        vehicle.location = { lat: s.delivery.lat, lng: s.delivery.lng };
        logActivity({ entityType: "vehicle", entityId: vehicle.id, kind: "trip", message: `Completed trip ${s.id}: ${s.pickup.city} → ${s.delivery.city} (${s.distanceKm} km)` });
      }
      if (driver) driver.status = "available";
      notify({ type: "delivery", severity: "success", title: `${s.id} delivered`, message: `Delivered to ${s.customer.company} in ${s.delivery.city}.`, link: `/shipments/${s.id}` });
      break;
    case "delayed":
      notify({ type: "delay", severity: "critical", title: `Shipment ${s.id} is delayed`, message: `${s.pickup.city} → ${s.delivery.city}: ${note?.trim() || "ETA has passed"}.`, link: `/shipments/${s.id}` });
      break;
    case "cancelled":
      if (vehicle && vehicle.status === "active") {
        vehicle.status = "idle";
        vehicle.speed = 0;
      }
      if (driver && driver.status === "on-duty") driver.status = "available";
      notify({ type: "delivery", severity: "warning", title: `${s.id} cancelled`, message: note?.trim() || "Shipment was cancelled.", link: `/shipments/${s.id}` });
      break;
    default:
      break;
  }
  logActivity({ entityType: "shipment", entityId: s.id, kind: "status", message: `${s.id} marked as ${SHIPMENT_STATUS[status].label.toLowerCase()}` });
}

export const shipmentHandlers = {
  list: () => getDb().shipments,

  create(input) {
    const db = getDb();
    const id = nextNumericId(db.shipments, "SHP", 10200);
    const s = {
      ...input,
      id,
      status: "pending",
      progress: 0,
      distanceKm: roadDistanceKm(input.pickup, input.delivery),
      deliveredAt: null,
      createdAt: nowIso(),
      history: [{ id: uid("EV"), status: "pending", note: "Shipment created and awaiting assignment", date: nowIso(), city: input.pickup.city }],
    };
    if (s.driverId && s.vehicleId) {
      s.status = "assigned";
      const d = db.drivers.find((x) => x.id === s.driverId);
      s.history.push({ id: uid("EV"), status: "assigned", note: `Assigned to ${d?.name ?? s.driverId} (${s.vehicleId})`, date: nowIso() });
    }
    db.shipments.unshift(s);
    logActivity({ entityType: "shipment", entityId: id, kind: "created", message: `${id} created for ${s.customer.company}` });
    notify({ type: "delivery", severity: "info", title: `New shipment ${id}`, message: `${s.pickup.city} → ${s.delivery.city} for ${s.customer.company}.`, link: `/shipments/${id}` });
    commit();
    return s;
  },

  update(id, input) {
    const s = findShipment(id);
    if (s.status === "delivered" || s.status === "cancelled") {
      throw new ApiError("Completed shipments can no longer be edited.", 409);
    }
    Object.assign(s, input);
    s.distanceKm = roadDistanceKm(s.pickup, s.delivery);
    if (s.status === "pending" && s.driverId && s.vehicleId) {
      applyStatus(s, "assigned", `Assigned to ${findDriver(s.driverId).name} (${s.vehicleId})`);
    } else if (s.status === "assigned" && (!s.driverId || !s.vehicleId)) {
      applyStatus(s, "pending", "Assignment removed");
    } else {
      logActivity({ entityType: "shipment", entityId: id, kind: "updated", message: `${id} details updated` });
    }
    commit();
    return s;
  },

  updateStatus(id, status, note) {
    const s = findShipment(id);
    if ((status === "in-transit" || status === "assigned") && (!s.driverId || !s.vehicleId)) {
      throw new ApiError("Assign a driver and vehicle before moving this shipment forward.", 422);
    }
    applyStatus(s, status, note);
    commit();
    return s;
  },

  remove(id) {
    const db = getDb();
    const s = findShipment(id);
    if (isLive(s)) throw new ApiError("Shipments that are on the road can't be deleted. Cancel it first.", 409);
    db.shipments = db.shipments.filter((x) => x.id !== id);
    commit();
    return { id };
  },
};

/* ------------------------------ Notifications ---------------------------- */

export const notificationHandlers = {
  list: () => getDb().notifications,
  markRead(id) {
    const n = getDb().notifications.find((x) => x.id === id);
    if (n) n.read = true;
    commit();
    return n;
  },
  markAllRead() {
    getDb().notifications.forEach((n) => (n.read = true));
    commit();
    return true;
  },
  remove(id) {
    const db = getDb();
    db.notifications = db.notifications.filter((n) => n.id !== id);
    commit();
    return { id };
  },
  clear() {
    getDb().notifications = [];
    commit();
    return true;
  },
};

export const activityHandlers = {
  list: () => getDb().activities,
};

/* ----------------------------- Live simulation --------------------------- */

/**
 * Moves every live shipment a little further along its route. In production
 * this would be replaced by GPS pings pushed over a WebSocket.
 */
export function simulateTick() {
  const db = getDb();
  const now = Date.now();

  // assigned shipments whose pickup time has arrived start moving automatically
  db.shipments
    .filter((s) => s.status === "assigned" && s.driverId && s.vehicleId && new Date(s.pickupDate).getTime() <= now)
    .forEach((s) => applyStatus(s, "in-transit", `Picked up from ${s.pickup.city}`));

  db.shipments.filter(isLive).forEach((s) => {
    const vehicle = s.vehicleId ? db.vehicles.find((v) => v.id === s.vehicleId) : undefined;
    const step = s.status === "delayed" ? 0.15 + Math.random() * 0.25 : 0.3 + Math.random() * 0.6;
    s.progress = Math.min(100, Math.round((s.progress + step) * 10) / 10);

    if (vehicle) {
      vehicle.location = pointOnRoute(s.pickup, s.delivery, s.progress);
      vehicle.speed = Math.round(s.status === "delayed" ? 15 + Math.random() * 35 : 55 + Math.random() * 40);
      vehicle.city = s.progress > 50 ? s.delivery.city : s.pickup.city;
      const prevFuel = vehicle.fuelLevel;
      if (vehicle.fuelType !== "Electric" || Math.random() > 0.5) {
        vehicle.fuelLevel = Math.max(3, Math.round((vehicle.fuelLevel - Math.random() * 0.4) * 10) / 10);
      }
      if (prevFuel >= LOW_FUEL_THRESHOLD && vehicle.fuelLevel < LOW_FUEL_THRESHOLD) {
        notify({ type: "maintenance", severity: "warning", title: `Low fuel: ${vehicle.plateNumber}`, message: `Fuel level dropped below ${LOW_FUEL_THRESHOLD}%.`, link: `/vehicles/${vehicle.id}` });
      }
    }

    if (s.progress >= 100) {
      applyStatus(s, "delivered", `Delivered to ${s.customer.name}`);
    } else if (s.status === "in-transit" && now > new Date(s.eta).getTime()) {
      applyStatus(s, "delayed", "Estimated arrival time exceeded");
    }
  });
  commit();
  return true;
}

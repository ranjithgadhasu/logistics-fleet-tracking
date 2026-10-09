import { CITIES } from "@/constants";
import { pointOnRoute, roadDistanceKm } from "@/utils/geo";

/* Seeded RNG (mulberry32) so the demo data is the same on every reset. */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const VEHICLE_MODELS = [
  { make: "Freightliner", model: "Cascadia", type: "Truck", fuel: "Diesel", cap: 18000, eff: 3.1 },
  { make: "Volvo", model: "VNL 860", type: "Truck", fuel: "Diesel", cap: 20000, eff: 3.3 },
  { make: "Kenworth", model: "T680", type: "Truck", fuel: "Diesel", cap: 19000, eff: 3.0 },
  { make: "Ford", model: "Transit 350", type: "Van", fuel: "Petrol", cap: 1600, eff: 8.5 },
  { make: "Mercedes-Benz", model: "Sprinter", type: "Van", fuel: "Diesel", cap: 1800, eff: 9.2 },
  { make: "Isuzu", model: "NRR Reefer", type: "Refrigerated", fuel: "Diesel", cap: 6500, eff: 5.4 },
  { make: "Rivian", model: "EDV 700", type: "Van", fuel: "Electric", cap: 1400, eff: 4.2 },
  { make: "Peterbilt", model: "579", type: "Truck", fuel: "Diesel", cap: 19500, eff: 3.2 },
  { make: "Ram", model: "ProMaster", type: "Van", fuel: "Petrol", cap: 1500, eff: 8.0 },
  { make: "Ford", model: "F-350", type: "Pickup", fuel: "Diesel", cap: 3200, eff: 6.5 },
  { make: "Utility", model: "3000R", type: "Trailer", fuel: "Diesel", cap: 22000, eff: 2.8 },
  { make: "Tesla", model: "Semi", type: "Truck", fuel: "Electric", cap: 17000, eff: 1.9 },
];

const DRIVER_NAMES = [
  "Marcus Johnson", "Elena Rodriguez", "David Chen", "Aisha Patel", "James O'Connor",
  "Sofia Martinez", "Tyrone Williams", "Hannah Kim", "Carlos Rivera", "Priya Sharma",
  "Michael Brooks", "Grace Thompson", "Andre Dubois", "Olivia Nguyen", "Samuel Green",
  "Fatima Hassan", "Ryan Mitchell", "Leah Goldberg",
];

const COMPANIES = [
  "Northwind Traders", "Acme Supplies", "Blue Harbor Foods", "Summit Electronics", "Greenleaf Organics",
  "Atlas Furniture", "Pioneer Pharma", "Redwood Retail", "Vertex Auto Parts", "Brightline Apparel",
  "Cobalt Industrial", "Maple & Co. Home", "Horizon Medical", "Keystone Building", "Lumen Tech",
];

const CONTACTS = [
  "Laura Bennett", "Kevin Park", "Nadia Ali", "Tom Fischer", "Rachel Moore", "Victor Ortiz", "Emily Shaw",
  "Daniel Reyes", "Megan Clarke", "Jordan Lee", "Isabel Cruz", "Peter Novak",
];

const CARGO = [
  "Consumer electronics", "Frozen food", "Pharmaceuticals", "Office furniture", "Auto parts",
  "Building materials", "Apparel & textiles", "Fresh produce", "Industrial machinery", "Retail goods",
  "Medical supplies", "Paper products",
];

const STREETS = ["Main St", "Commerce Blvd", "Industrial Pkwy", "Harbor Dr", "Market St", "Logistics Way", "Warehouse Rd", "Park Ave"];

/** Generates the full demo database: vehicles, drivers, shipments, notifications, activities. */
export function createSeed() {
  const r = rng(20240611);
  const now = Date.now();
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const between = (a, b) => a + r() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const iso = (t) => new Date(t).toISOString();
  const address = (c) => `${int(100, 9800)} ${pick(STREETS)}, ${c.name}, ${c.state}`;

  /* ---------------- Drivers ---------------- */
  const drivers = DRIVER_NAMES.map((name, i) => {
    const city = CITIES[i % CITIES.length];
    const [first, last] = name.toLowerCase().replace("'", "").split(" ");
    return {
      id: `DRV-${101 + i}`,
      name,
      email: `${first}.${last}@fleetops.io`,
      phone: `+1 (${int(200, 989)}) ${int(200, 989)}-${int(1000, 9999)}`,
      licenseNumber: `CDL-${int(100000, 999999)}`,
      licenseExpiry: iso(now + (i === 4 ? 12 : int(60, 1400)) * DAY),
      status: "available",
      vehicleId: null,
      city: city.name,
      rating: Math.round(between(3.8, 5) * 10) / 10,
      experienceYears: int(1, 22),
      joinedAt: iso(now - int(120, 2400) * DAY),
    };
  });

  /* ---------------- Vehicles ---------------- */
  const vehicles = Array.from({ length: 20 }, (_, i) => {
    const m = VEHICLE_MODELS[i % VEHICLE_MODELS.length];
    const city = CITIES[(i * 3) % CITIES.length];
    const last = now - int(15, 160) * DAY;
    // a few vehicles are close to / past their service date so alerts show up
    const next = i === 2 ? now - 3 * DAY : i === 6 ? now + 2 * DAY : i === 11 ? now + 5 * DAY : last + int(170, 200) * DAY;
    return {
      id: `VH-${201 + i}`,
      plateNumber: `${pick(["TX", "CA", "IL", "NY", "GA", "WA", "CO"])}-${int(1000, 9999)}-${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}`,
      make: m.make,
      model: m.model,
      year: int(2017, 2024),
      type: m.type,
      status: "idle",
      fuelType: m.fuel,
      fuelLevel: i === 8 ? 12 : int(28, 98),
      fuelEfficiency: m.eff,
      capacityKg: m.cap,
      mileage: int(18000, 420000),
      lastServiceDate: iso(last),
      nextServiceDate: iso(next),
      driverId: null,
      city: city.name,
      location: { lat: city.lat, lng: city.lng },
      speed: 0,
      createdAt: iso(now - int(200, 1800) * DAY),
    };
  });

  // Pair the first 15 vehicles with drivers
  for (let i = 0; i < 15; i++) {
    vehicles[i].driverId = drivers[i].id;
    drivers[i].vehicleId = vehicles[i].id;
  }
  vehicles[15].status = "maintenance";
  vehicles[16].status = "maintenance";
  vehicles[17].status = "offline";
  drivers[15].status = "off-duty";
  drivers[16].status = "on-leave";

  /* ---------------- Shipments ---------------- */
  const shipments = [];
  const activities = [];
  let evt = 1;
  let act = 1;
  const event = (status, note, t, city) => ({ id: `EV-${evt++}`, status, note, date: iso(t), city });
  const addActivity = (a) => activities.push({ id: `ACT-${act++}`, ...a });

  const activePlan = [
    "in-transit", "in-transit", "delayed", "in-transit", "assigned", "in-transit", "delayed",
    "in-transit", "pending", "in-transit", "assigned", "pending", "in-transit", "pending",
  ];
  const historicalCount = 38;
  let activeVehicleIdx = 0;

  const total = historicalCount + activePlan.length;
  for (let i = 0; i < total; i++) {
    const from = pick(CITIES);
    let to = pick(CITIES);
    while (to.name === from.name) to = pick(CITIES);
    const distanceKm = roadDistanceKm(from, to);
    const durationMs = Math.max(4, distanceKm / 62) * HOUR;
    const historical = i < historicalCount;
    const contact = pick(CONTACTS);
    const company = pick(COMPANIES);
    const priority = pick(["low", "normal", "normal", "normal", "high", "high", "urgent"]);

    let status;
    let pickupT;
    let progress = 0;
    let deliveredAt = null;
    let driverId = null;
    let vehicleId = null;
    let eta;

    if (historical) {
      // spread across the last 30 days
      pickupT = now - (30 - (i / historicalCount) * 28) * DAY - int(0, 10) * HOUR;
      eta = pickupT + durationMs + 2 * HOUR;
      status = r() < 0.06 ? "cancelled" : "delivered";
      const pair = int(0, 14);
      driverId = drivers[pair].id;
      vehicleId = vehicles[pair].id;
      if (status === "delivered") {
        const late = r() < 0.16;
        const deliveredT = late ? eta + int(2, 14) * HOUR : eta - int(0, 3) * HOUR;
        deliveredAt = iso(deliveredT);
        progress = 100;
      }
    } else {
      status = activePlan[i - historicalCount];
      if (status === "pending") {
        pickupT = now + int(6, 60) * HOUR;
        eta = pickupT + durationMs + 3 * HOUR;
      } else {
        const v = vehicles[activeVehicleIdx];
        const d = drivers[activeVehicleIdx];
        activeVehicleIdx++;
        driverId = d.id;
        vehicleId = v.id;
        if (status === "assigned") {
          pickupT = now + int(2, 20) * HOUR;
          eta = pickupT + durationMs + 2 * HOUR;
          v.city = from.name;
          v.location = { lat: from.lat, lng: from.lng };
        } else {
          progress = status === "delayed" ? int(55, 85) : int(12, 88);
          pickupT = now - (progress / 100) * durationMs;
          eta = status === "delayed" ? now - int(1, 5) * HOUR : pickupT + durationMs + 2 * HOUR;
          v.status = "active";
          v.speed = int(52, 96);
          v.location = pointOnRoute(from, to, progress);
          v.city = progress > 50 ? to.name : from.name;
          d.status = "on-duty";
        }
      }
    }

    const createdT = pickupT - int(8, 48) * HOUR;
    const history = [event("pending", "Shipment created and awaiting assignment", createdT, from.name)];
    if (driverId) {
      const drv = drivers.find((x) => x.id === driverId);
      history.push(event("assigned", `Assigned to ${drv.name} (${vehicleId})`, createdT + 2 * HOUR, from.name));
    }
    if (["in-transit", "delayed", "delivered"].includes(status)) {
      history.push(event("in-transit", `Picked up from ${from.name}`, pickupT, from.name));
    }
    if (status === "delayed") {
      history.push(event("delayed", pick(["Heavy traffic on interstate", "Severe weather on route", "Mechanical inspection stop", "Road closure detour"]), eta));
    }
    if (status === "delivered" && deliveredAt) {
      history.push(event("delivered", `Delivered to ${contact}`, new Date(deliveredAt).getTime(), to.name));
    }
    if (status === "cancelled") {
      history.push(event("cancelled", "Cancelled by customer", pickupT - HOUR, from.name));
    }

    const id = `SHP-${10200 + i}`;
    shipments.push({
      id,
      customer: {
        name: contact,
        company,
        email: `${contact.split(" ")[0].toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
        phone: `+1 (${int(200, 989)}) ${int(200, 989)}-${int(1000, 9999)}`,
      },
      pickup: { address: address(from), city: from.name, lat: from.lat, lng: from.lng },
      delivery: { address: address(to), city: to.name, lat: to.lat, lng: to.lng },
      driverId,
      vehicleId,
      status,
      priority,
      cargo: pick(CARGO),
      weightKg: int(250, 16000),
      distanceKm,
      progress,
      pickupDate: iso(pickupT),
      eta: iso(eta),
      deliveredAt,
      createdAt: iso(createdT),
      history,
    });

    if (status === "delivered" && vehicleId) {
      addActivity({ entityType: "vehicle", entityId: vehicleId, kind: "trip", message: `Completed trip ${id}: ${from.name} → ${to.name} (${distanceKm} km)`, date: deliveredAt });
    }
    if (status === "in-transit" && vehicleId) {
      addActivity({ entityType: "vehicle", entityId: vehicleId, kind: "trip", message: `Departed ${from.name} with ${id}`, date: iso(pickupT) });
    }
    const lastEvent = history[history.length - 1];
    addActivity({ entityType: "shipment", entityId: id, kind: "status", message: `${id} ${lastEvent.note.toLowerCase()}`, date: lastEvent.date });
  }

  vehicles.forEach((v) => {
    addActivity({ entityType: "vehicle", entityId: v.id, kind: "maintenance", message: `Scheduled service completed at ${v.city} depot`, date: v.lastServiceDate });
    addActivity({ entityType: "vehicle", entityId: v.id, kind: "fuel", message: `Refuelled — ${int(80, 420)} L`, date: iso(now - int(1, 9) * DAY) });
    if (v.driverId) {
      const d = drivers.find((x) => x.id === v.driverId);
      addActivity({ entityType: "vehicle", entityId: v.id, kind: "assignment", message: `${d.name} assigned as primary driver`, date: iso(now - int(20, 90) * DAY) });
    }
  });

  /* ---------------- Notifications ---------------- */
  let n = 1;
  const notifications = [];
  const notify = (x) => notifications.push({ id: `NT-${n++}`, read: false, ...x });

  shipments
    .filter((s) => s.status === "delayed")
    .forEach((s) =>
      notify({
        type: "delay",
        severity: "critical",
        title: `Shipment ${s.id} is delayed`,
        message: `${s.pickup.city} → ${s.delivery.city}: ${s.history[s.history.length - 1].note}.`,
        createdAt: s.eta,
        link: `/shipments/${s.id}`,
      }),
    );

  vehicles.forEach((v) => {
    const diff = new Date(v.nextServiceDate).getTime() - now;
    if (diff < 7 * DAY) {
      notify({
        type: "maintenance",
        severity: diff < 0 ? "critical" : "warning",
        title: diff < 0 ? `Service overdue for ${v.plateNumber}` : `Service due soon for ${v.plateNumber}`,
        message: `${v.make} ${v.model} ${diff < 0 ? "missed" : "is due for"} scheduled maintenance.`,
        createdAt: iso(now - int(1, 20) * HOUR),
        link: `/vehicles/${v.id}`,
      });
    }
    if (v.fuelLevel < 20) {
      notify({
        type: "maintenance",
        severity: "warning",
        title: `Low fuel: ${v.plateNumber}`,
        message: `Fuel level at ${v.fuelLevel}%. Plan a refuel stop.`,
        createdAt: iso(now - 3 * HOUR),
        link: `/vehicles/${v.id}`,
      });
    }
  });

  shipments
    .filter((s) => s.status === "delivered")
    .slice(-4)
    .forEach((s) =>
      notify({
        type: "delivery",
        severity: "success",
        title: `${s.id} delivered`,
        message: `Delivered to ${s.customer.company} in ${s.delivery.city}.`,
        createdAt: s.deliveredAt,
        read: true,
        link: `/shipments/${s.id}`,
      }),
    );

  notify({
    type: "driver",
    severity: "info",
    title: `${drivers[16].name} is on leave`,
    message: "Driver marked as on leave until further notice.",
    createdAt: iso(now - 26 * HOUR),
    link: `/drivers/${drivers[16].id}`,
  });
  notify({
    type: "driver",
    severity: "warning",
    title: `License expiring: ${drivers[4].name}`,
    message: "Commercial driver license expires in less than 2 weeks.",
    createdAt: iso(now - 5 * HOUR),
    link: `/drivers/${drivers[4].id}`,
  });

  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { vehicles, drivers, shipments, notifications, activities };
}

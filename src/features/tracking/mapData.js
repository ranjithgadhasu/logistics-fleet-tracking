import { SHIPMENT_STATUS, VEHICLE_STATUS } from "@/constants";
import { splitRoute } from "@/utils/geo";

/** Finds the shipment a vehicle is currently driving (if any). */
export function liveShipmentFor(vehicleId, shipments) {
  return shipments.find((s) => s.vehicleId === vehicleId && (s.status === "in-transit" || s.status === "delayed"));
}

/** Map markers for a list of vehicles, coloured by live shipment / vehicle status. */
export function vehicleMarkers(vehicles, shipments, drivers) {
  return vehicles.map((v) => {
    const live = liveShipmentFor(v.id, shipments);
    const driver = v.driverId ? drivers?.get(v.driverId) : undefined;
    const color = live ? SHIPMENT_STATUS[live.status].color : VEHICLE_STATUS[v.status].color;
    return {
      id: v.id,
      position: v.location,
      kind: "vehicle",
      color,
      pulse: !!live,
      tooltip: `${v.plateNumber}${driver ? ` · ${driver.name}` : ""}${live ? ` · ${live.id}` : ` · ${VEHICLE_STATUS[v.status].label}`}`,
    };
  });
}

/** Travelled part solid, remaining part dashed — plus pickup (A) / delivery (B) pins. */
export function shipmentRoute(s) {
  const color = SHIPMENT_STATUS[s.status].color;
  const { done, remaining } = splitRoute(s.pickup, s.delivery, s.progress);
  return {
    routes: [
      { id: `${s.id}-rem`, points: remaining, color: "#64748b", dashed: true, weight: 3, opacity: 0.7 },
      { id: `${s.id}-done`, points: done, color, weight: 5 },
    ],
    markers: [
      { id: `${s.id}-pickup`, position: s.pickup, kind: "pickup", tooltip: `Pickup · ${s.pickup.address}` },
      { id: `${s.id}-delivery`, position: s.delivery, kind: "delivery", tooltip: `Delivery · ${s.delivery.address}` },
    ],
  };
}

/** Remaining drive time (hours) based on progress and an average speed of 62 km/h. */
export function remainingHours(s) {
  const remainingKm = (s.distanceKm * (100 - s.progress)) / 100;
  return remainingKm / 62;
}

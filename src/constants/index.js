export const APP_NAME = "FleetOps";

/**
 * Status metadata: label for the UI, tone for <Badge>, hex colour for charts / map markers.
 * tone is one of: green | blue | amber | red | slate | violet | indigo
 */

export const VEHICLE_STATUS = {
  active: { label: "Active", tone: "green", color: "#10b981" },
  idle: { label: "Idle", tone: "blue", color: "#3b82f6" },
  maintenance: { label: "Maintenance", tone: "amber", color: "#f59e0b" },
  offline: { label: "Offline", tone: "slate", color: "#94a3b8" },
};

export const DRIVER_STATUS = {
  available: { label: "Available", tone: "green", color: "#10b981" },
  "on-duty": { label: "On duty", tone: "indigo", color: "#6366f1" },
  "off-duty": { label: "Off duty", tone: "slate", color: "#94a3b8" },
  "on-leave": { label: "On leave", tone: "amber", color: "#f59e0b" },
};

export const SHIPMENT_STATUS = {
  pending: { label: "Pending", tone: "slate", color: "#94a3b8" },
  assigned: { label: "Assigned", tone: "violet", color: "#8b5cf6" },
  "in-transit": { label: "In transit", tone: "blue", color: "#3b82f6" },
  delivered: { label: "Delivered", tone: "green", color: "#10b981" },
  delayed: { label: "Delayed", tone: "red", color: "#ef4444" },
  cancelled: { label: "Cancelled", tone: "slate", color: "#64748b" },
};

export const PRIORITY = {
  low: { label: "Low", tone: "slate", color: "#94a3b8" },
  normal: { label: "Normal", tone: "blue", color: "#3b82f6" },
  high: { label: "High", tone: "amber", color: "#f59e0b" },
  urgent: { label: "Urgent", tone: "red", color: "#ef4444" },
};

export const SEVERITY = {
  info: { label: "Info", tone: "blue", color: "#3b82f6" },
  success: { label: "Success", tone: "green", color: "#10b981" },
  warning: { label: "Warning", tone: "amber", color: "#f59e0b" },
  critical: { label: "Critical", tone: "red", color: "#ef4444" },
};

export const NOTIFICATION_TYPE = {
  delay: "Delays",
  maintenance: "Maintenance",
  delivery: "Deliveries",
  driver: "Drivers",
  system: "System",
};

export const VEHICLE_TYPES = ["Truck", "Van", "Trailer", "Pickup", "Refrigerated"];
export const FUEL_TYPES = ["Diesel", "Petrol", "Electric", "CNG"];

/** The status flow a shipment normally travels through. */
export const SHIPMENT_FLOW = ["pending", "assigned", "in-transit", "delivered"];

export const CITIES = [
  { name: "New York", state: "NY", lat: 40.7128, lng: -74.006 },
  { name: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { name: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  { name: "Washington", state: "DC", lat: 38.9072, lng: -77.0369 },
  { name: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { name: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458 },
  { name: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  { name: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
  { name: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { name: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { name: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { name: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { name: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074 },
  { name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { name: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
  { name: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988 },
  { name: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265 },
  { name: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786 },
  { name: "St. Louis", state: "MO", lat: 38.627, lng: -90.1994 },
  { name: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431 },
  { name: "Memphis", state: "TN", lat: 35.1495, lng: -90.049 },
  { name: "Salt Lake City", state: "UT", lat: 40.7608, lng: -111.891 },
  { name: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398 },
  { name: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { name: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581 },
];

export const CITY_NAMES = CITIES.map((c) => c.name).sort();

export function findCity(name) {
  return CITIES.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
}

/** Days before the next service date at which we start warning. */
export const SERVICE_WARNING_DAYS = 7;
export const LOW_FUEL_THRESHOLD = 20;

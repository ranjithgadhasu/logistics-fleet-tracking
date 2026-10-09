/** REST endpoints used when talking to a real backend. */
export const endpoints = {
  vehicles: "/vehicles",
  vehicle: (id) => `/vehicles/${id}`,
  vehicleDriver: (id) => `/vehicles/${id}/driver`,

  drivers: "/drivers",
  driver: (id) => `/drivers/${id}`,

  shipments: "/shipments",
  shipment: (id) => `/shipments/${id}`,
  shipmentStatus: (id) => `/shipments/${id}/status`,

  notifications: "/notifications",
  notification: (id) => `/notifications/${id}`,
  notificationsReadAll: "/notifications/read-all",

  activities: "/activities",
  trackingTick: "/tracking/tick",
};

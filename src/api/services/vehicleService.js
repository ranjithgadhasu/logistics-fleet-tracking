import { http, mockRequest, USE_MOCK } from "../client";
import { endpoints } from "../endpoints";
import { vehicleHandlers } from "../mock/handlers";

export const vehicleService = {
  list: (opts) => (USE_MOCK ? mockRequest(vehicleHandlers.list, opts) : http.get(endpoints.vehicles)),

  create: (input) => (USE_MOCK ? mockRequest(() => vehicleHandlers.create(input)) : http.post(endpoints.vehicles, input)),

  update: (id, patch) => (USE_MOCK ? mockRequest(() => vehicleHandlers.update(id, patch)) : http.patch(endpoints.vehicle(id), patch)),

  remove: (id) => (USE_MOCK ? mockRequest(() => vehicleHandlers.remove(id)) : http.delete(endpoints.vehicle(id))),

  assignDriver: (id, driverId) =>
    USE_MOCK ? mockRequest(() => vehicleHandlers.assignDriver(id, driverId)) : http.put(endpoints.vehicleDriver(id), { driverId }),
};

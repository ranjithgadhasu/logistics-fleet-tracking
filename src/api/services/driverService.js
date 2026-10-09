import { http, mockRequest, USE_MOCK } from "../client";
import { endpoints } from "../endpoints";
import { driverHandlers } from "../mock/handlers";

export const driverService = {
  list: (opts) => (USE_MOCK ? mockRequest(driverHandlers.list, opts) : http.get(endpoints.drivers)),

  create: (input) => (USE_MOCK ? mockRequest(() => driverHandlers.create(input)) : http.post(endpoints.drivers, input)),

  update: (id, patch) => (USE_MOCK ? mockRequest(() => driverHandlers.update(id, patch)) : http.patch(endpoints.driver(id), patch)),

  remove: (id) => (USE_MOCK ? mockRequest(() => driverHandlers.remove(id)) : http.delete(endpoints.driver(id))),
};

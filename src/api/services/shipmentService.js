import { http, mockRequest, USE_MOCK } from "../client";
import { endpoints } from "../endpoints";
import { shipmentHandlers, simulateTick } from "../mock/handlers";

export const shipmentService = {
  list: (opts) => (USE_MOCK ? mockRequest(shipmentHandlers.list, opts) : http.get(endpoints.shipments)),

  create: (input) => (USE_MOCK ? mockRequest(() => shipmentHandlers.create(input)) : http.post(endpoints.shipments, input)),

  update: (id, input) => (USE_MOCK ? mockRequest(() => shipmentHandlers.update(id, input)) : http.patch(endpoints.shipment(id), input)),

  updateStatus: (id, status, note) =>
    USE_MOCK ? mockRequest(() => shipmentHandlers.updateStatus(id, status, note)) : http.post(endpoints.shipmentStatus(id), { status, note }),

  remove: (id) => (USE_MOCK ? mockRequest(() => shipmentHandlers.remove(id)) : http.delete(endpoints.shipment(id))),

  /** Live GPS simulation – a real backend would stream positions instead. */
  tick: () => (USE_MOCK ? mockRequest(simulateTick, { silent: true }) : Promise.resolve(true)),
};

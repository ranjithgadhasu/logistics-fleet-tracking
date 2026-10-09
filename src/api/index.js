import { mockRequest, USE_MOCK } from "./client";
import { resetDb } from "./mock/db";

export * from "./client";
export { vehicleService } from "./services/vehicleService";
export { driverService } from "./services/driverService";
export { shipmentService } from "./services/shipmentService";
export { notificationService, activityService } from "./services/notificationService";

export const systemService = {
  /** Restores the demo dataset (mock mode only). */
  resetDemoData: () =>
    USE_MOCK
      ? mockRequest(() => {
          resetDb();
          return true;
        })
      : Promise.resolve(true),
};

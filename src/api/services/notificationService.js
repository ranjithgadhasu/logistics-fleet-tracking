import { http, mockRequest, USE_MOCK } from "../client";
import { endpoints } from "../endpoints";
import { activityHandlers, notificationHandlers } from "../mock/handlers";

export const notificationService = {
  list: (opts) => (USE_MOCK ? mockRequest(notificationHandlers.list, opts) : http.get(endpoints.notifications)),

  markRead: (id) =>
    USE_MOCK ? mockRequest(() => notificationHandlers.markRead(id), { silent: true }) : http.patch(endpoints.notification(id), { read: true }),

  markAllRead: () => (USE_MOCK ? mockRequest(notificationHandlers.markAllRead) : http.post(endpoints.notificationsReadAll)),

  remove: (id) => (USE_MOCK ? mockRequest(() => notificationHandlers.remove(id), { silent: true }) : http.delete(endpoints.notification(id))),

  clear: () => (USE_MOCK ? mockRequest(notificationHandlers.clear) : http.delete(endpoints.notifications)),
};

export const activityService = {
  list: (opts) => (USE_MOCK ? mockRequest(activityHandlers.list, opts) : http.get(endpoints.activities)),
};

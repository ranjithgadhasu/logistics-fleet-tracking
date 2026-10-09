import { create } from "zustand";

/** UI-only state: mobile sidebar + toast notifications. */
export const useUiStore = create((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toasts: [],
  pushToast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Convenience helpers usable outside React components. */
export const toast = {
  success: (title, description) => useUiStore.getState().pushToast({ type: "success", title, description }),
  error: (title, description) => useUiStore.getState().pushToast({ type: "error", title, description }),
  info: (title, description) => useUiStore.getState().pushToast({ type: "info", title, description }),
  warning: (title, description) => useUiStore.getState().pushToast({ type: "warning", title, description }),
};

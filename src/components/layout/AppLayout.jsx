import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui";
import { useFleetStore } from "@/store/fleetStore";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const LIVE_INTERVAL_MS = 8000;

export function AppLayout() {
  const fetchAll = useFleetStore((s) => s.fetchAll);
  const tick = useFleetStore((s) => s.tick);
  const { pathname } = useLocation();

  // initial load
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // live position updates (paused while the tab is hidden)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") tick().catch(() => undefined);
    }, LIVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tick]);

  // scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

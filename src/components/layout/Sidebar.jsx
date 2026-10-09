import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Bug, LayoutDashboard, MapPinned, Package, RotateCcw, Truck, Users, X } from "lucide-react";
import { devSettings, USE_MOCK } from "@/api";
import { APP_NAME } from "@/constants";
import { useFleetStore } from "@/store/fleetStore";
import { toast, useUiStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tracking", label: "Live Tracking", icon: MapPinned },
  { to: "/shipments", label: "Shipments", icon: Package },
  { to: "/vehicles", label: "Vehicles", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const unread = useFleetStore((s) => s.notifications.filter((n) => !n.read).length);
  const liveCount = useFleetStore((s) => s.shipments.filter((x) => x.status === "in-transit" || x.status === "delayed").length);
  const resetDemo = useFleetStore((s) => s.resetDemo);
  const fetchAll = useFleetStore((s) => s.fetchAll);
  const [simulate, setSimulate] = useState(devSettings.simulateErrors);
  const [resetting, setResetting] = useState(false);

  const toggleErrors = () => {
    const next = !simulate;
    devSettings.simulateErrors = next;
    setSimulate(next);
    toast.info(
      next ? "API error simulation on" : "API error simulation off",
      next ? "Requests will now fail so you can see error states." : "Requests behave normally again.",
    );
    fetchAll();
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
    } catch {
      /* toast shown */
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      {/* mobile backdrop */}
      <div
        className={cn("fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold leading-none text-white">{APP_NAME}</p>
              <p className="mt-1 text-[11px] text-slate-500">Logistics Control</p>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="thin-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Operations</p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="flex-1">{label}</span>
                  {to === "/notifications" && unread > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>
                  )}
                  {to === "/tracking" && liveCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {liveCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {USE_MOCK && (
          <div className="m-3 space-y-2 rounded-2xl border border-white/5 bg-white/3 p-3">
            <button onClick={handleReset} disabled={resetting} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-50">
              <RotateCcw className={cn("h-3.5 w-3.5", resetting && "animate-spin")} /> Reset demo data
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

import { Menu } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useFleetStore } from "@/store/fleetStore";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";

export function Topbar() {
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const status = useFleetStore((s) => s.status);
  const offline = status === "error";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
      <button className="-ml-1 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <span className={cn("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium md:inline-flex", offline ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", offline ? "bg-rose-500" : "animate-pulse bg-emerald-500")} />
          {offline ? "Offline" : "Live"}
        </span>
        <NotificationBell />
        <div className="ml-1 flex items-center gap-2.5 border-l border-slate-200 pl-3">
          <Avatar name="Alex Morgan" size="sm" />
          <div className="hidden leading-tight xl:block">
            <p className="text-sm font-semibold text-slate-900">Alex Morgan</p>
            <p className="text-xs text-slate-500">Fleet Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}

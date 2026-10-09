import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { useFleetStore } from "@/store/fleetStore";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const notifications = useFleetStore((s) => s.notifications);
  const markAll = useFleetStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Notifications (${unread} unread)`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unread} unread</p>
            </div>
            {unread > 0 && (
              <button onClick={() => markAll().catch(() => undefined)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="thin-scrollbar max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">You're all caught up 🎉</p>
            ) : (
              notifications.slice(0, 8).map((n) => <NotificationItem key={n.id} notification={n} compact onNavigate={() => setOpen(false)} />)
            )}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 py-3 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

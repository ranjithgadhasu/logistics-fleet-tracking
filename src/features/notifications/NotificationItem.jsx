import { useNavigate } from "react-router-dom";
import { Check, Clock, Info, Package, Trash2, User, Wrench } from "lucide-react";
import { SEVERITY } from "@/constants";
import { useFleetStore } from "@/store/fleetStore";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/format";

const typeIcon = { delay: Clock, maintenance: Wrench, delivery: Package, driver: User, system: Info };

const severityStyle = {
  info: "bg-sky-50 text-sky-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  critical: "bg-rose-50 text-rose-600",
};

export function NotificationItem({ notification: n, compact, onNavigate }) {
  const navigate = useNavigate();
  const markRead = useFleetStore((s) => s.markNotificationRead);
  const remove = useFleetStore((s) => s.deleteNotification);
  const Icon = typeIcon[n.type] ?? Info;

  const open = () => {
    if (!n.read) markRead(n.id);
    if (n.link) {
      navigate(n.link);
      onNavigate?.();
    }
  };

  return (
    <div className={cn("group relative flex gap-3 transition hover:bg-slate-50", compact ? "px-4 py-3" : "px-4 py-4 sm:px-5", !n.read && "bg-indigo-50/30")}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", severityStyle[n.severity])}>
        <Icon className="h-4 w-4" />
      </div>
      <button onClick={open} className="min-w-0 flex-1 text-left">
        <div className="flex items-start gap-2">
          <p className={cn("text-sm text-slate-900", n.read ? "font-medium" : "font-semibold")}>{n.title}</p>
          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="unread" />}
        </div>
        <p className={cn("mt-0.5 text-sm text-slate-500", compact && "line-clamp-2")}>{n.message}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          {timeAgo(n.createdAt)}
          {!compact && (
            <span className="rounded-full px-1.5 py-px text-[10px] font-semibold uppercase" style={{ color: SEVERITY[n.severity].color, background: `${SEVERITY[n.severity].color}14` }}>
              {SEVERITY[n.severity].label}
            </span>
          )}
        </p>
      </button>
      {!compact && (
        <div className="flex shrink-0 items-start gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {!n.read && (
            <button onClick={() => markRead(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-emerald-600" title="Mark as read" aria-label="Mark as read">
              <Check className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => remove(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600" title="Delete" aria-label="Delete notification">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

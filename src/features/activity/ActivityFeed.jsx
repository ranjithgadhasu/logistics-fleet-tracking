import { Fuel, MapPin, Package, Pencil, PlusCircle, RefreshCw, Trash2, UserPlus, Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateTime, timeAgo } from "@/utils/format";

const kindStyle = {
  created: { icon: PlusCircle, cls: "bg-emerald-50 text-emerald-600" },
  updated: { icon: Pencil, cls: "bg-slate-100 text-slate-600" },
  status: { icon: RefreshCw, cls: "bg-indigo-50 text-indigo-600" },
  assignment: { icon: UserPlus, cls: "bg-violet-50 text-violet-600" },
  maintenance: { icon: Wrench, cls: "bg-amber-50 text-amber-600" },
  fuel: { icon: Fuel, cls: "bg-sky-50 text-sky-600" },
  trip: { icon: MapPin, cls: "bg-teal-50 text-teal-600" },
  deleted: { icon: Trash2, cls: "bg-rose-50 text-rose-600" },
};

export function ActivityFeed({ items, limit = 8, emptyText = "No activity yet" }) {
  if (items.length === 0) return <EmptyState title={emptyText} className="py-10" />;
  const list = items.slice(0, limit);
  return (
    <ol className="relative space-y-1">
      {list.map((a, i) => {
        const { icon: Icon, cls } = kindStyle[a.kind] ?? { icon: Package, cls: "bg-slate-100 text-slate-600" };
        return (
          <li key={a.id} className="relative flex gap-3 pb-3">
            {i < list.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-28px)] w-px bg-slate-200" aria-hidden />}
            <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white", cls)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm text-slate-700">{a.message}</p>
              <p className="mt-0.5 text-xs text-slate-400" title={formatDateTime(a.date)}>
                {timeAgo(a.date)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

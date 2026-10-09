import { serviceState } from "@/store/selectors";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

export function ServiceBadge({ vehicle }) {
  const st = serviceState(vehicle);
  if (st === "ok") return <span className="text-sm text-slate-600">{formatDate(vehicle.nextServiceDate)}</span>;
  return (
    <span className="flex flex-col">
      <span className="text-sm text-slate-600">{formatDate(vehicle.nextServiceDate)}</span>
      <span className={cn("text-xs font-semibold", st === "overdue" ? "text-rose-600" : "text-amber-600")}>{st === "overdue" ? "Overdue" : "Due soon"}</span>
    </span>
  );
}

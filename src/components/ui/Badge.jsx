import { cn } from "@/utils/cn";

const tones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
};

export function Badge({ tone = "slate", children, className, dot, dotColor }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor ?? "currentColor" }} />}
      {children}
    </span>
  );
}

/** Renders any status from the constants maps, e.g. <StatusBadge meta={VEHICLE_STATUS[v.status]} /> */
export function StatusBadge({ meta, className }) {
  return (
    <Badge tone={meta.tone} dot dotColor={meta.color} className={className}>
      {meta.label}
    </Badge>
  );
}

import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";

/* --------------------------------- Avatar -------------------------------- */

const palette = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];
const avatarSizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-20 w-20 text-2xl" };

export function Avatar({ name, size = "md", className }) {
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white",
        palette[hash % palette.length],
        avatarSizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

/* ------------------------------ Progress bar ----------------------------- */

export function ProgressBar({ value, color, className, size = "md" }) {
  const v = Math.max(0, Math.min(100, value));
  const auto = v < 20 ? "#ef4444" : v < 45 ? "#f59e0b" : "#10b981";
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-slate-100", size === "sm" ? "h-1.5" : "h-2", className)}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: color ?? auto }} />
    </div>
  );
}

/* ------------------------------- Page header ----------------------------- */

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------------------------- Tabs --------------------------------- */

/** @param {{ items: {key:string,label:string,count?:number}[], value: string, onChange: (k:string)=>void }} props */
export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1", className)} role="tablist">
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
              active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-white/20" : "bg-slate-200/70 text-slate-600")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Info row ------------------------------- */

export function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

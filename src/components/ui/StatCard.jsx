import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "./Card";

const accents = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

/**
 * KPI tile.
 * @param {{ label: string, value: React.ReactNode, icon: React.ReactNode, accent?: string,
 *           hint?: React.ReactNode, trend?: { value: number, positiveIsGood?: boolean }, onClick?: () => void }} props
 */
export function StatCard({ label, value, icon, accent = "indigo", hint, trend, onClick }) {
  const up = (trend?.value ?? 0) >= 0;
  const good = trend ? (trend.positiveIsGood ?? true) === up : true;
  return (
    <Card onClick={onClick} className={cn("group relative overflow-hidden p-4 sm:p-5", onClick && "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accents[accent])}>{icon}</div>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {trend && (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", good ? "text-emerald-600" : "text-rose-600")}>
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint && <span className="text-slate-500">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

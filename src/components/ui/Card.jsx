import { cn } from "@/utils/cn";

export function Card({ className, ...rest }) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40", className)} {...rest} />;
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }) {
  return <div className={cn("p-5", className)} {...rest} />;
}

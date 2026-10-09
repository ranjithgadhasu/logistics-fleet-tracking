import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:px-5">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>–<span className="font-semibold text-slate-700">{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn("h-8 min-w-8 rounded-lg px-2 text-xs font-semibold", p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {p}
            </button>
          ),
        )}
        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

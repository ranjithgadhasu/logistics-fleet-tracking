import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/utils/cn";

/**
 * Search box + advanced filters. On mobile/tablet the advanced filters
 * collapse behind a "Filters" toggle to save space.
 */
export function FilterBar({ search, onSearch, placeholder = "Search…", activeCount, onClear, resultCount, children }) {
  const [term, setTerm] = useState(search);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(term, 250);
  const lastEmitted = useRef(search);

  useEffect(() => {
    if (debounced !== search) {
      lastEmitted.current = debounced;
      onSearch(debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // keep the input in sync only when the value changes externally (e.g. "Clear filters")
  useEffect(() => {
    if (search !== lastEmitted.current) {
      lastEmitted.current = search;
      setTerm(search);
    }
  }, [search]);

  return (
    <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            aria-label="Search"
          />
          {term && (
            <button onClick={() => setTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children && (
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium lg:hidden",
              open || activeCount ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600",
            )}
            aria-expanded={open}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] text-white">{activeCount}</span>}
          </button>
        )}
      </div>

      {children && <div className={cn("grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end", open ? "grid" : "hidden lg:flex")}>{children}</div>}

      {(activeCount > 0 || resultCount !== undefined) && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{resultCount !== undefined && <>{resultCount} result{resultCount === 1 ? "" : "s"}</>}</span>
          {activeCount > 0 && (
            <button onClick={onClear} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800">
              <X className="h-3.5 w-3.5" /> Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** @param {{ label: string, value: string, onChange: (v:string)=>void, options: {value:string,label:string}[], allLabel?: string }} props */
export function FilterSelect({ label, value, onChange, options, allLabel = "All" }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 lg:w-40">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full cursor-pointer rounded-lg border bg-white px-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
          value ? "border-indigo-300 text-indigo-700" : "border-slate-200 text-slate-700",
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterDate({ label, value, onChange }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 lg:w-40">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-lg border bg-white px-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
          value ? "border-indigo-300 text-indigo-700" : "border-slate-200 text-slate-700",
        )}
      />
    </label>
  );
}

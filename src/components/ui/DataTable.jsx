import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/utils/cn";
import { Pagination } from "./Pagination";

const hide = { lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

/**
 * Sortable, paginated table that switches to cards on mobile.
 *
 * columns: [{ key, header, render(row), sortValue?(row), className?, hideBelow?: "lg" | "xl" }]
 * mobileCard(row): JSX rendered below the `md` breakpoint
 */
export function DataTable({ columns, rows, rowKey, onRowClick, mobileCard, empty, pageSize = 10, initialSort }) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      const r = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const { page, setPage, totalPages, pageItems, total } = usePagination(sorted, pageSize);

  const toggleSort = (key) => setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5", c.hideBelow && hide[c.hideBelow], c.className)}
                >
                  {c.sortValue ? (
                    <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-slate-800">
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map((row) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-indigo-50/40")}>
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3.5 align-middle first:pl-5 last:pr-5", c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {pageItems.map((row) => (
          <div key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn("p-4", onRowClick && "cursor-pointer active:bg-slate-50")}>
            {mobileCard(row)}
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Search, Truck, User, X } from "lucide-react";
import { DRIVER_STATUS, SHIPMENT_STATUS, VEHICLE_STATUS } from "@/constants";
import { useFleetStore } from "@/store/fleetStore";
import { cn } from "@/utils/cn";

const groupIcon = { Shipments: Package, Vehicles: Truck, Drivers: User };

/** Search across shipments, vehicles and drivers. Shortcut: Ctrl/⌘ + K */
export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const shipments = useFleetStore((s) => s.shipments);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMobileOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...xs) => xs.some((x) => x.toLowerCase().includes(term));
    return [
      ...shipments
        .filter((s) => has(s.id, s.customer.company, s.customer.name, s.pickup.city, s.delivery.city))
        .slice(0, 5)
        .map((s) => ({ id: s.id, group: "Shipments", title: `${s.id} · ${s.customer.company}`, subtitle: `${s.pickup.city} → ${s.delivery.city}`, to: `/shipments/${s.id}`, color: SHIPMENT_STATUS[s.status].color })),
      ...vehicles
        .filter((v) => has(v.plateNumber, v.make, v.model, v.id, v.city))
        .slice(0, 4)
        .map((v) => ({ id: v.id, group: "Vehicles", title: `${v.plateNumber} · ${v.make} ${v.model}`, subtitle: `${v.type} · ${v.city}`, to: `/vehicles/${v.id}`, color: VEHICLE_STATUS[v.status].color })),
      ...drivers
        .filter((d) => has(d.name, d.email, d.id, d.city))
        .slice(0, 4)
        .map((d) => ({ id: d.id, group: "Drivers", title: d.name, subtitle: `${d.id} · ${d.city}`, to: `/drivers/${d.id}`, color: DRIVER_STATUS[d.status].color })),
    ];
  }, [q, shipments, vehicles, drivers]);

  useEffect(() => setActive(0), [q]);

  const go = (r) => {
    navigate(r.to);
    setQ("");
    setOpen(false);
    setMobileOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setMobileOpen(false);
      inputRef.current?.blur();
    }
  };

  let lastGroup = "";

  return (
    <>
      <button
        className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 sm:hidden"
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
      <div className={cn("sm:relative sm:block sm:w-full sm:max-w-md", mobileOpen ? "absolute inset-x-0 top-0 z-30 flex h-16 items-center bg-white px-3" : "hidden")}>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            placeholder="Search shipments, vehicles, drivers…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-16 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
            Ctrl K
          </kbd>
          {mobileOpen && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 sm:hidden" onClick={() => setMobileOpen(false)} aria-label="Close search">
              <X className="h-5 w-5" />
            </button>
          )}

          {open && q.trim().length >= 2 && (
            <div className="animate-fade-in absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No matches for “{q}”</p>
              ) : (
                results.map((r, i) => {
                  const header = r.group !== lastGroup;
                  lastGroup = r.group;
                  const Icon = groupIcon[r.group];
                  return (
                    <div key={`${r.group}-${r.id}`}>
                      {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.group}</p>}
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(r)}
                        onMouseEnter={() => setActive(i)}
                        className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left", i === active && "bg-slate-100")}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900">{r.title}</span>
                          <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>
                        </span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

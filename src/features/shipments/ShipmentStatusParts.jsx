import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button, Field, Modal, Textarea } from "@/components/ui";
import { SHIPMENT_FLOW, SHIPMENT_STATUS } from "@/constants";
import { useFleetStore } from "@/store/fleetStore";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";

/** Which statuses a shipment can move to from its current status. */
export const TRANSITIONS = {
  pending: ["assigned", "cancelled"],
  assigned: ["in-transit", "pending", "cancelled"],
  "in-transit": ["delivered", "delayed", "cancelled"],
  delayed: ["in-transit", "delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function StatusUpdateModal({ shipment, open, onClose }) {
  const update = useFleetStore((s) => s.updateShipmentStatus);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!shipment) return null;
  const options = TRANSITIONS[shipment.status];

  const close = () => {
    setStatus("");
    setNote("");
    setError("");
    onClose();
  };

  const submit = async () => {
    if (!status) return setError("Choose the new status");
    if ((status === "delayed" || status === "cancelled") && note.trim().length < 4) return setError("Please add a short reason");
    setBusy(true);
    try {
      await update(shipment.id, status, note);
      close();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title={`Update ${shipment.id}`}
      description={`Currently ${SHIPMENT_STATUS[shipment.status].label.toLowerCase()}`}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={options.length === 0}>
            Update status
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="text-sm text-slate-500">This shipment is completed and its status can no longer change.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((o) => {
              const meta = SHIPMENT_STATUS[o];
              const active = status === o;
              return (
                <button
                  key={o}
                  onClick={() => {
                    setStatus(o);
                    setError("");
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition",
                    active ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                  <span className="flex-1">{meta.label}</span>
                  {active && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              );
            })}
          </div>
          <Field label="Note" htmlFor="status-note" hint="Visible in the shipment history." error={error}>
            <Textarea id="status-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Heavy traffic on I-80, expect 2h delay" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

/** Horizontal progress stepper: Pending → Assigned → In transit → Delivered */
export function StatusStepper({ status }) {
  const effective = status === "delayed" ? "in-transit" : status;
  const idx = SHIPMENT_FLOW.indexOf(effective);
  const cancelled = status === "cancelled";

  return (
    <ol className="flex items-center">
      {SHIPMENT_FLOW.map((s, i) => {
        const done = !cancelled && i < idx;
        const current = !cancelled && i === idx;
        const isDelayed = current && status === "delayed";
        return (
          <li key={s} className={cn("flex items-center", i < SHIPMENT_FLOW.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white",
                  done && "bg-emerald-500 text-white",
                  current && !isDelayed && (s === "delivered" ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"),
                  isDelayed && "bg-rose-500 text-white",
                  !done && !current && "bg-slate-100 text-slate-400",
                )}
              >
                {done || (current && s === "delivered") ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-[11px] font-medium sm:text-xs", current ? "text-slate-900" : "text-slate-500")}>
                {isDelayed ? "Delayed" : SHIPMENT_STATUS[s].label}
              </span>
            </div>
            {i < SHIPMENT_FLOW.length - 1 && <span className={cn("mx-1 mb-5 h-0.5 flex-1 rounded sm:mx-2", done ? "bg-emerald-400" : "bg-slate-200")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function ShipmentTimeline({ shipment }) {
  const events = [...shipment.history].reverse();
  return (
    <ol className="space-y-0">
      {events.map((e, i) => {
        const meta = SHIPMENT_STATUS[e.status];
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < events.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />}
            <span className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white shadow" style={{ background: meta.color }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
              <p className="text-sm text-slate-600">{e.note}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateTime(e.date)}
                {e.city && ` · ${e.city}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RouteLabel({ from, to, className }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-700", className)}>
      <span className="truncate">{from}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{to}</span>
    </span>
  );
}

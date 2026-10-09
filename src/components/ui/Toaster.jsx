import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-rose-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1100] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:items-end">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
          {icons[t.type]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="rounded-md p-0.5 text-slate-400 hover:text-slate-700" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

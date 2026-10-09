import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

const base =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500";
const ok = "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10";
const bad = "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10";

/** Label + control + error/hint wrapper. */
export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, error, icon, ...rest }, ref) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input ref={ref} aria-invalid={!!error} className={cn(base, "h-10", error ? bad : ok, icon && "pl-9", className)} {...rest} />
    </div>
  );
});

export const Select = forwardRef(function Select({ className, error, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={!!error} className={cn(base, "h-10 cursor-pointer appearance-none pr-9", error ? bad : ok, className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ className, error, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={!!error} className={cn(base, "min-h-[88px] py-2.5", error ? bad : ok, className)} {...rest} />;
});

/** Sticky action bar placed at the end of a form rendered inside <Modal>. */
export function FormActions({ onCancel, submitting, submitLabel }) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-70"
      >
        {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export function FormSection({ title, description, children }) {
  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-sm font-semibold text-slate-900">{title}</legend>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

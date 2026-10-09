/**
 * Tiny, composable validation rules used by `useForm`.
 * Each rule is `(value, allValues) => errorMessage | undefined`.
 */

export const required =
  (msg = "This field is required") =>
  (v) => {
    if (v === null || v === undefined) return msg;
    if (typeof v === "string" && v.trim() === "") return msg;
    return undefined;
  };

export const minLength = (n, msg) => (v) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length < n ? msg ?? `Must be at least ${n} characters` : undefined;

export const maxLength = (n, msg) => (v) =>
  typeof v === "string" && v.length > n ? msg ?? `Must be ${n} characters or less` : undefined;

export const email =
  (msg = "Enter a valid email address") =>
  (v) =>
    typeof v === "string" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? msg : undefined;

export const phone =
  (msg = "Enter a valid phone number") =>
  (v) =>
    typeof v === "string" && v && !/^\+?[\d\s\-().]{7,20}$/.test(v) ? msg : undefined;

export const pattern = (re, msg) => (v) => (typeof v === "string" && v && !re.test(v) ? msg : undefined);

export const numberBetween = (min, max, msg) => (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return "Must be a number";
  if (n < min || n > max) return msg ?? `Must be between ${min} and ${max}`;
  return undefined;
};

export const dateAfter = (field, msg) => (v, all) => {
  const other = all?.[field];
  if (!v || !other) return undefined;
  return new Date(String(v)).getTime() <= new Date(String(other)).getTime() ? msg : undefined;
};

export const notEqualTo = (field, msg) => (v, all) =>
  v && all?.[field] && String(v).toLowerCase() === String(all[field]).toLowerCase() ? msg : undefined;

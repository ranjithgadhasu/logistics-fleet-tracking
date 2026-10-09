import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names, resolving conflicts (e.g. "px-2 px-4" -> "px-4"). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

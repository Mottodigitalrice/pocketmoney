import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip `undefined` values from an object so it satisfies
 * `exactOptionalPropertyTypes`. Convex documents typically expose optional
 * fields as `T | undefined`, but our domain types use `T?` (omit on undefined).
 * Use this when adapting Convex doc shapes to our domain types.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const out: Record<string, unknown> = {};
  for (const k in obj) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}

/**
 * Utility helpers — add shared pure functions here.
 *
 * Example usage:
 *   import { cn } from "@/lib/utils";
 */

import { type ClassValue, clsx } from "clsx";

/**
 * Merges class names (works with Tailwind).
 * Install clsx: `npm i clsx`
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Format a Date to a human-readable string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

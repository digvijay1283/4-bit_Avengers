/**
 * Global state stores.
 *
 * Recommended: use Zustand for lightweight global state.
 * Install: `npm i zustand`
 *
 * Example store:
 * ──────────────────────────────────────────────────────────
 * import { create } from "zustand";
 *
 * type ThemeStore = {
 *   theme: "light" | "dark";
 *   toggleTheme: () => void;
 * };
 *
 * export const useThemeStore = create<ThemeStore>((set) => ({
 *   theme: "light",
 *   toggleTheme: () =>
 *     set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
 * }));
 * ──────────────────────────────────────────────────────────
 */

export {};

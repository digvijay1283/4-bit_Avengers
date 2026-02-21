/**
 * App-wide constants.
 * Import individual groups to keep bundle-level tree-shaking effective.
 */

export const APP_NAME = "Cavista";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ─── Routes ────────────────────────────────────────────────────────── */
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
} as const;

/* ─── Pagination ────────────────────────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ─── Query keys (React Query / SWR cache keys) ─────────────────────── */
export const QUERY_KEYS = {
  USER: "user",
  USERS: "users",
} as const;

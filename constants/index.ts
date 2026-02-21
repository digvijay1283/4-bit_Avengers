/**
 * App-wide constants.
 * Import individual groups to keep bundle-level tree-shaking effective.
 */

export const APP_NAME = "VitalAI";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ─── Routes ────────────────────────────────────────────────────────── */
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  MEDICINE: "/medicine",
  MENTAL_HEALTH: "/mental-health",
  REPORTS: "/reports",
  UPLOAD: "/upload",
  CHAT: "/chat",
} as const;

/* ─── Pagination ────────────────────────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ─── Query keys (React Query / SWR cache keys) ─────────────────────── */
export const QUERY_KEYS = {
  USER: "user",
  USERS: "users",
  HEALTH_DATA: "health_data",
  MEDICINES: "medicines",
  REPORTS: "reports",
} as const;

/* ─── Health Thresholds ─────────────────────────────────────────────── */
export const HEALTH_THRESHOLDS = {
  HEART_RATE_HIGH: 100,
  HEART_RATE_LOW: 50,
  HEART_RATE_CRITICAL_HIGH: 120,
  HEART_RATE_CRITICAL_LOW: 45,
  STEPS_DAILY_GOAL: 10000,
  SLEEP_MIN_HOURS: 6,
  SLEEP_CRITICAL_HOURS: 4,
  CALORIES_DAILY_GOAL: 2000,
} as const;

/* ─── Navigation ────────────────────────────────────────────────────── */
export const NAV_ITEMS = [
  { label: "Home", href: ROUTES.HOME, icon: "Home" },
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Profile", href: ROUTES.PROFILE, icon: "User" },
  { label: "Reports", href: ROUTES.REPORTS, icon: "FileText" },
] as const;

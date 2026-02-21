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
  DOCTOR: "/doctor",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  MEDI_REMINDER: "/medi-reminder",
  MEDICINE: "/medicine",
  MENTAL_HEALTH: "/mental-health",
  REPORTS: "/reports",
  UPLOAD: "/upload",
  CHAT: "/chat",
} as const;

export type AppRole = "user" | "doctor";

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
  { label: "Medi Reminder", href: ROUTES.MEDI_REMINDER, icon: "Pill" },
  { label: "Doctor", href: ROUTES.DOCTOR, icon: "Stethoscope" },
  { label: "Profile", href: ROUTES.PROFILE, icon: "User" },
  { label: "Reports", href: ROUTES.REPORTS, icon: "FileText" },
] as const;

export const NAV_ACCESS: Record<string, AppRole[]> = {
  [ROUTES.HOME]: ["user", "doctor"],
  [ROUTES.DASHBOARD]: ["user", "doctor"],
  [ROUTES.MEDI_REMINDER]: ["user"],
  [ROUTES.DOCTOR]: ["doctor"],
  [ROUTES.PROFILE]: ["user", "doctor"],
  [ROUTES.REPORTS]: ["user", "doctor"],
};

export function getNavItemsByRole(role: AppRole) {
  return NAV_ITEMS.filter((item) => {
    const allowedRoles = NAV_ACCESS[item.href] ?? ["user", "doctor"];
    return allowedRoles.includes(role);
  });
}

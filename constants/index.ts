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
  DOCTOR_PATIENT: "/doctor/patient", // + /[id]
  LOGIN: "/login",
  SIGNUP: "/signup",
  PROFILE: "/profile",
  MEDI_REMINDER: "/medi-reminder",
  MENTAL_HEALTH: "/mental-health",
  REPORTS: "/reports",
  SHARE: "/share",
  UPLOAD: "/upload",
  CHAT: "/chat",
  ASSISTANT: "/assistant",
  DOCTOR_SHARED: "/doctor/shared", // + /[token]
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

// User nav: user-specific pages
const USER_NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Medi Reminder", href: ROUTES.MEDI_REMINDER, icon: "Pill" },
  { label: "Reports", href: ROUTES.REPORTS, icon: "FileText" },
  { label: "Share", href: ROUTES.SHARE, icon: "QrCode" },
  { label: "Mental Health", href: ROUTES.MENTAL_HEALTH, icon: "Brain" },
  { label: "Chat", href: ROUTES.CHAT, icon: "MessageCircle" },
  { label: "AI Assistant", href: ROUTES.ASSISTANT, icon: "Bot" },
  { label: "Profile", href: ROUTES.PROFILE, icon: "User" },
] as const;

// Doctor nav: doctor-specific pages
const DOCTOR_NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DOCTOR, icon: "LayoutDashboard" },
  { label: "Profile", href: ROUTES.PROFILE, icon: "User" },
] as const;

// Route → allowed roles (used for guards)
export const ROUTE_ACCESS: Record<string, AppRole[]> = {
  [ROUTES.HOME]: ["user", "doctor"],
  [ROUTES.DASHBOARD]: ["user"],
  [ROUTES.MEDI_REMINDER]: ["user"],
  [ROUTES.REPORTS]: ["user"],
  [ROUTES.MENTAL_HEALTH]: ["user"],
  [ROUTES.UPLOAD]: ["user"],
  [ROUTES.CHAT]: ["user", "doctor"],
  [ROUTES.ASSISTANT]: ["user"],
  [ROUTES.SHARE]: ["user"],
  [ROUTES.DOCTOR]: ["doctor"],
  [ROUTES.DOCTOR_PATIENT]: ["doctor"],
  [ROUTES.DOCTOR_SHARED]: ["doctor"],
  [ROUTES.PROFILE]: ["user", "doctor"],
};

export function getNavItemsByRole(role: AppRole) {
  if (role === "doctor") return [...DOCTOR_NAV_ITEMS];
  return [...USER_NAV_ITEMS];
}

/** Get the default "home" route for an authenticated role */
export function getHomeRouteForRole(role: AppRole) {
  return role === "doctor" ? ROUTES.DOCTOR : ROUTES.DASHBOARD;
}

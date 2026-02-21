/**
 * Global TypeScript types & interfaces.
 *
 * Keep domain-specific types co-located with their feature; put
 * truly shared types here.
 */

/* ─── API response wrapper ──────────────────────────────────────────── */
export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/* ─── User ──────────────────────────────────────────────────────────── */
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "doctor" | "user" | "guest";
  createdAt: string;
};

/* ─── Navigation ────────────────────────────────────────────────────── */
export type NavItem = {
  label: string;
  href: string;
  icon?: React.ElementType;
  children?: NavItem[];
};

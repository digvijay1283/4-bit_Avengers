import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";

export type AppRole = "user" | "doctor";

export type AuthUser = {
  userId: string;
  email: string;
  role: AppRole;
  fullName: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  // 1. Try Bearer token from Authorization header (mobile / API clients)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // 2. Fall back to httpOnly cookie (web client)
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("auth_token")?.value;
  }

  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const normalizedRole =
      (payload as { role?: string }).role === "admin"
        ? "doctor"
        : payload.role;

    if (!payload.sub || !payload.email || !normalizedRole) return null;

    return {
      userId: payload.sub,
      email: payload.email,
      role: normalizedRole,
      fullName: (payload as { fullName?: string }).fullName ?? "",
    };
  } catch {
    return null;
  }
}

export async function requireAuth(redirectTo = "/login"): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireRole(role: AppRole, fallbackPath: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect(fallbackPath);
  }
  return user;
}

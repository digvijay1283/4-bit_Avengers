"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppRole } from "@/constants";

/* ─── Types ─────────────────────────────────────────────────────────── */
export type SessionUser = {
  userId: string;
  email: string;
  role: AppRole;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  user: SessionUser | null;
  status: SessionStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

/* ─── Context ───────────────────────────────────────────────────────── */
const SessionContext = createContext<SessionContextValue>({
  user: null,
  status: "loading",
  refresh: async () => {},
  logout: async () => {},
});

/* ─── Provider ──────────────────────────────────────────────────────── */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as {
        authenticated: boolean;
        user: SessionUser | null;
      };

      if (data.authenticated && data.user) {
        setUser(data.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
    setStatus("unauthenticated");
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, status, refresh, logout }),
    [user, status, refresh, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────────────────── */
export function useSession() {
  return useContext(SessionContext);
}

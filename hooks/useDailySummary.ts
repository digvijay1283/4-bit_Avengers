/**
 * useDailySummary
 *
 * On mount (once per calendar day per user) calls `/api/daily-summary`,
 * stores the result in **sessionStorage** keyed as
 *   `user_summary:<userId>:<YYYY-MM-DD>`
 * and removes any entry from a previous day for the same user.
 *
 * Returns `{ summary, isLoading, error }`.
 */

"use client";

import { useEffect, useState, useRef } from "react";

const SESSION_KEY_PREFIX = "user_summary";

function todayKey(userId: string) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${SESSION_KEY_PREFIX}:${userId}:${yyyy}-${mm}-${dd}`;
}

/** Remove all user_summary entries for this user except today's */
function pruneOldEntries(userId: string, keepKey: string) {
  const prefix = `${SESSION_KEY_PREFIX}:${userId}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k && k.startsWith(prefix) && k !== keepKey) {
      toRemove.push(k);
    }
  }
  toRemove.forEach((k) => sessionStorage.removeItem(k));
}

export function useDailySummary(userId: string | null) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!userId || userId === "guest" || fetched.current) return;
    fetched.current = true;

    const key = todayKey(userId);

    // Already fetched today — reuse cached value (ignore stale sentinel values)
    const cached = sessionStorage.getItem(key);
    if (
      cached &&
      cached !== "NO_USER_DATA_FOUND" &&
      cached.trim() !== ""
    ) {
      setSummary(cached);
      pruneOldEntries(userId, key);
      return;
    }

    // Remove stale NO_USER_DATA_FOUND entry so it doesn't linger in storage
    if (cached) {
      sessionStorage.removeItem(key);
    }

    // First login of the day — call the webhook proxy
    setIsLoading(true);
    fetch("/api/daily-summary")
      .then(async (res) => {
        const body = (await res.json()) as {
          ok: boolean;
          summary?: string;
          message?: string;
        };
        if (
          body.ok &&
          body.summary &&
          body.summary.trim() !== "" &&
          body.summary.trim() !== "NO_USER_DATA_FOUND"
        ) {
          sessionStorage.setItem(key, body.summary);
          pruneOldEntries(userId, key);
          setSummary(body.summary);
        } else if (!body.ok) {
          setError(body.message ?? "Failed to load daily summary");
        }
        // If ok but no meaningful summary (noData), leave summary null — don't cache
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Network error");
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { summary, isLoading, error };
}

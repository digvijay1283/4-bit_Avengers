"use client";

import { useState, useEffect, useCallback } from "react";
import type { FitnessData } from "@/types/fitness";
import { fitnessService } from "@/services/fitness";

interface UseFitnessDataReturn {
  /** Fitness data from Google Fit (null while loading or if not connected) */
  data: FitnessData | null;
  /** Whether data is currently being fetched */
  loading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether the user has connected their Google Fit account */
  connected: boolean;
  /** Whether the connection status is still being checked */
  checkingConnection: boolean;
  /** Manually re-fetch all data */
  refresh: () => Promise<void>;
  /** Initiate Google Fit OAuth connection */
  connect: () => Promise<void>;
  /** Disconnect Google Fit */
  disconnect: () => Promise<void>;
}

/**
 * Hook that manages fetching and caching Google Fit data from the stats proxy.
 *
 * @param autoRefreshMs - Auto-refresh interval in ms (default: 60_000 = 1 min). Set 0 to disable.
 */
export function useFitnessData(autoRefreshMs = 60_000): UseFitnessDataReturn {
  const [data, setData] = useState<FitnessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // ── Check connection status ───────────────────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      setCheckingConnection(true);
      const status = await fitnessService.getStatus();
      setConnected(status.connected);
      return status.connected;
    } catch {
      setConnected(false);
      return false;
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  // ── Fetch all fitness data ────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fitnessService.getAllData();
      setData(result);
      setConnected(true);
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === "not_connected" || e.code === "token_expired") {
        setConnected(false);
        setData(null);
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Connect (redirect to Google OAuth) ────────────────────────────
  const connect = useCallback(async () => {
    try {
      const { url } = await fitnessService.getAuthUrl();
      // The stats server's Google OAuth will redirect back to
      // our /api/fitness/callback which stores the token and
      // redirects to /dashboard
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      await fitnessService.disconnect();
      setConnected(false);
      setData(null);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const isConnected = await checkStatus();
      if (isConnected) {
        await refresh();
      }
    })();
  }, [checkStatus, refresh]);

  // ── Auto-refresh interval ─────────────────────────────────────────
  useEffect(() => {
    if (!connected || autoRefreshMs <= 0) return;

    const id = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(id);
  }, [connected, autoRefreshMs, refresh]);

  return {
    data,
    loading,
    error,
    connected,
    checkingConnection,
    refresh,
    connect,
    disconnect,
  };
}

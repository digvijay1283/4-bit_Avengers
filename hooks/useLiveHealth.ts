"use client";

import { useCallback, useEffect, useState } from "react";

export type LiveHealthData = {
  heartRate: number | null;
  bloodPressure: string | null;
  sleep: string | null;
  steps: number | null;
  riskScore: number | null;
  updatedAt: string | null;
};

const EMPTY_DATA: LiveHealthData = {
  heartRate: null,
  bloodPressure: null,
  sleep: null,
  steps: null,
  riskScore: null,
  updatedAt: null,
};

export function useLiveHealth() {
  const [data, setData] = useState<LiveHealthData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/health/live", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: LiveHealthData;
      };

      if (response.ok && payload.ok && payload.data) {
        setData(payload.data);
      } else {
        setData(EMPTY_DATA);
      }
    } catch {
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, refresh };
}

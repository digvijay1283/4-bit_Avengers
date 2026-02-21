/**
 * Service layer for communicating with the fitness (Google Fit) proxy API.
 */

import type {
  FitnessData,
  FitnessStatus,
  FitnessAuthUrl,
  FitnessMetric,
} from "@/types/fitness";

const BASE = "/api/fitness";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const err = new Error(body.message ?? `HTTP ${res.status}`) as Error & {
      status: number;
      code: string;
    };
    err.status = res.status;
    err.code = body.error ?? "unknown";
    throw err;
  }

  return res.json() as Promise<T>;
}

export const fitnessService = {
  /** Check if user has a Google Fit connection */
  getStatus: () => fetchJSON<FitnessStatus>(`${BASE}/status`),

  /** Get the Google OAuth URL to connect Google Fit */
  getAuthUrl: () => fetchJSON<FitnessAuthUrl>(`${BASE}/auth`),

  /** Get all fitness data at once */
  getAllData: () => fetchJSON<FitnessData>(`${BASE}/data`),

  /** Get a single metric */
  getMetric: <T = Record<string, number>>(metric: FitnessMetric) =>
    fetchJSON<T>(`${BASE}/${metric}`),

  /** Disconnect Google Fit */
  disconnect: () =>
    fetchJSON<FitnessStatus>(`${BASE}/status`, { method: "DELETE" }),
};

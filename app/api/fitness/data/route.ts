import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STATS_API = process.env.STATS_API_URL ?? "http://localhost:8080";

/**
 * Helper to forward requests to the stats server with the stored JWT.
 */
async function proxyToStats(endpoint: string, token: string) {
  const res = await fetch(`${STATS_API}/api${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text };
  }

  const data = await res.json();
  return { ok: true, data };
}

/**
 * GET /api/fitness/data
 *
 * Returns all Google Fit data (steps, heartRate, sleep, calories, bloodOxygen).
 * The stats server JWT is read from the `stats_token` cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("stats_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "not_connected", message: "Google Fit not connected" },
        { status: 401 }
      );
    }

    const result = await proxyToStats("/all", token);

    if (!result.ok) {
      // If 401 from stats server, the token is likely expired
      if (result.status === 401) {
        return NextResponse.json(
          { error: "token_expired", message: "Google Fit session expired. Please reconnect." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "stats_error", message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "proxy_error", message, details: "Stats server may be offline" },
      { status: 502 }
    );
  }
}

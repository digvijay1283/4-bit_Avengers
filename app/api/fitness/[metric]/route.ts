import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STATS_API = process.env.STATS_API_URL ?? "http://localhost:8080";

/**
 * GET /api/fitness/[metric]
 *
 * Proxy individual metric endpoints: steps, heartrate, sleep, calories, bloodoxygen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ metric: string }> }
) {
  try {
    const { metric } = await params;
    const validMetrics = ["steps", "heartrate", "sleep", "calories", "bloodoxygen"];

    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: "invalid_metric", message: `Invalid metric: ${metric}` },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("stats_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "not_connected", message: "Google Fit not connected" },
        { status: 401 }
      );
    }

    const res = await fetch(`${STATS_API}/api/${metric}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "stats_error", message: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "proxy_error", message },
      { status: 502 }
    );
  }
}

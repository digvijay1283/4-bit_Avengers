import { NextResponse } from "next/server";

const STATS_API = process.env.STATS_API_URL ?? "http://localhost:8080";

/**
 * GET /api/fitness/auth
 * Returns the Google OAuth URL from the stats server so the user can
 * connect their Google Fit account.
 */
export async function GET() {
  try {
    const res = await fetch(`${STATS_API}/auth/google`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to get auth URL from stats server" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Stats server unreachable", details: message },
      { status: 502 }
    );
  }
}

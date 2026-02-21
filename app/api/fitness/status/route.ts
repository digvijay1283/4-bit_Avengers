import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/fitness/status
 * Checks if the user has a stats_token cookie (i.e. Google Fit is connected).
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("stats_token")?.value;

  return NextResponse.json({
    connected: !!token,
  });
}

/**
 * DELETE /api/fitness/status
 * Disconnect Google Fit by removing the stats_token cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ connected: false });
  response.cookies.delete("stats_token");
  return response;
}

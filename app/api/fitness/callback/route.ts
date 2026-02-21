import { NextRequest, NextResponse } from "next/server";

const STATS_API = process.env.STATS_API_URL ?? "http://localhost:8080";

/**
 * GET /api/fitness/callback?code=...&token=...
 *
 * After the user completes Google OAuth on the stats server, they are
 * redirected back with a JWT token.  We store it in a cookie and redirect
 * the user to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const dashboardUrl = new URL("/dashboard", request.url);

  if (error) {
    dashboardUrl.searchParams.set("fit_error", error);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!token) {
    dashboardUrl.searchParams.set("fit_error", "no_token");
    return NextResponse.redirect(dashboardUrl);
  }

  // Store the stats JWT in a cookie
  const response = NextResponse.redirect(dashboardUrl);
  response.cookies.set("stats_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}

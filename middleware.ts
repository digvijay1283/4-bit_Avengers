import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that intercepts the Google Fit OAuth redirect.
 *
 * When the stats server redirects the user back to CLIENT_URL?token=JWT,
 * this middleware intercepts it, stores the JWT in a cookie, and cleans
 * the URL so the token isn't visible.
 */
export function middleware(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const token = searchParams.get("token");
  const fitError = searchParams.get("error");

  // ── Handle stats server OAuth redirect with token ─────────────────
  if (token && pathname !== "/api/fitness/callback") {
    // Redirect to dashboard with token stored in cookie
    const url = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(url);

    response.cookies.set("stats_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  }

  // ── Handle error redirect from stats server ───────────────────────
  if (fitError && pathname !== "/api/fitness/callback") {
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("fit_error", fitError);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * - API routes (they handle their own logic)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};

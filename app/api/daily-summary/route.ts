/**
 * GET /api/daily-summary
 *
 * Server-side proxy that calls the n8n mental-health webhook and returns
 * the user_summary for today.  The client calls this once per calendar day
 * (first visit) and caches the result in sessionStorage.
 *
 * The webhook returns:
 *   [{ "output": "…summary text…" }]
 *
 * We normalise that into:
 *   { ok: true, summary: "…summary text…" }
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";

const WEBHOOK_URL =
  "https://synthomind.cloud/webhook/mental-cavista-chatbot";

export async function GET() {
  // ── Auth ────────────────────────────────────────────────────────────────
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
    });

    if (!res.ok) {
      // Webhook unavailable — treat as "no data" so the UI stays clean
      console.warn(`[daily-summary] Webhook responded ${res.status} — returning noData`);
      return NextResponse.json(
        { ok: true, summary: null, noData: true },
        { status: 200 },
      );
    }

    const rawBody = await res.text();
    console.log("[daily-summary] Webhook raw response:", rawBody.slice(0, 300));

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = rawBody;
    }

    let summary = "";
    if (Array.isArray(parsed)) {
      summary = parsed
        .map((item: Record<string, unknown>) =>
          typeof item === "object" && item !== null
            ? String(item.output ?? "")
            : String(item)
        )
        .join("")
        .trim();
    } else if (typeof parsed === "object" && parsed !== null) {
      summary = String((parsed as Record<string, unknown>).output ?? "").trim();
    } else if (typeof parsed === "string") {
      summary = parsed.trim();
    }

    // Webhook returns this sentinel when the user has no health data yet.
    // Treat it as "no data" so the client doesn't cache a useless value.
    if (!summary || summary === "NO_USER_DATA_FOUND") {
      return NextResponse.json(
        { ok: true, summary: null, noData: true },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("[daily-summary] Webhook call failed:", msg);
    // Return graceful no-data so the UI doesn't show an error banner
    return NextResponse.json(
      { ok: true, summary: null, noData: true },
      { status: 200 },
    );
  }
}

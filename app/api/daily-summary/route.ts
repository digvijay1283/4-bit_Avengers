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
      return NextResponse.json(
        { ok: false, message: `Webhook responded ${res.status}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as
      | { output?: string }
      | { output?: string }[];

    const summary = Array.isArray(data)
      ? data.map((d) => d.output ?? "").join("")
      : (data.output ?? "");

    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: `Webhook call failed: ${msg}` },
      { status: 502 },
    );
  }
}

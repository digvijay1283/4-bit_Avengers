import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";

const WEBHOOK_URL = "https://synthomind.cloud/webhook/recom-system";

export interface DayRoutine {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
      // 10-second timeout so the dashboard doesn't hang
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: `Webhook responded ${res.status}` },
        { status: 502 }
      );
    }

    // Response may be: { "routine": {...} }  OR  [{ "routine": {...} }]
    const raw = await res.json() as { routine?: DayRoutine } | { routine?: DayRoutine }[];
    const entry = Array.isArray(raw) ? raw[0] : raw;
    const routine: DayRoutine = entry?.routine ?? { morning: [], afternoon: [], evening: [] };

    return NextResponse.json({ ok: true, routine });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: `Routine fetch failed: ${msg}` },
      { status: 502 }
    );
  }
}

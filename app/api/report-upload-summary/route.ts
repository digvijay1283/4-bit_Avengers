/**
 * POST /api/report-upload-summary
 *
 * Called after a report is successfully uploaded & OCR-extracted.
 * Sends the extracted document context to the n8n chatbot webhook and
 * returns the AI-generated summary so the client can cache it in
 * sessionStorage.
 *
 * Request body:
 *   { fileName, rawText, extractedData }
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
  "https://synthomind.cloud/webhook/mental-cavista-summary";

interface ReportPayload {
  fileName?: string;
  rawText?: string;
  extractedData?: Record<string, unknown> | null;
}

function buildFallbackSummary(body: ReportPayload): string {
  const fileName = body.fileName?.trim() || "Uploaded report";
  const rawText = body.rawText?.trim() || "";
  const extractedData = body.extractedData;

  if (extractedData && Object.keys(extractedData).length > 0) {
    const condensed = JSON.stringify(extractedData);
    return `${fileName}: ${condensed}`;
  }

  if (rawText) {
    const trimmed = rawText.replace(/\s+/g, " ").slice(0, 1200);
    return `${fileName}: ${trimmed}`;
  }

  return `${fileName}: Report uploaded successfully. Processing context from this document.`;
}

export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: ReportPayload = {};
  try {
    body = (await request.json()) as ReportPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    console.log("[report-upload-summary] Calling webhook:", WEBHOOK_URL);
    console.log("[report-upload-summary] Payload:", {
      userId: user.userId,
      trigger: "report_upload",
      fileName: body.fileName ?? "",
      rawTextLength: (body.rawText ?? "").length,
    });

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        trigger: "report_upload",
        fileName: body.fileName ?? "",
        rawText: body.rawText ?? "",
        extractedData: body.extractedData ?? null,
      }),
    });

    console.log("[report-upload-summary] Webhook response status:", res.status);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: `Webhook responded ${res.status}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as
      | { output?: string }
      | { output?: string }[];

    let summary = Array.isArray(data)
      ? data.map((d) => d.output ?? "").join("")
      : (data.output ?? "");

    if (summary.trim() === "NO_USER_DATA_FOUND") {
      summary = buildFallbackSummary(body);
    }

    return NextResponse.json(
      { ok: true, summary, userId: user.userId },
      { status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: `Webhook call failed: ${msg}` },
      { status: 502 },
    );
  }
}

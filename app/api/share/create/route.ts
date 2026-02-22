import { NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { ShareSession } from "@/models/ShareSession";
import { Report } from "@/models/Report";

export const runtime = "nodejs";

/**
 * POST /api/share/create
 * Patient creates a share session with selected report IDs.
 * Returns a token the patient encodes into a QR code.
 *
 * Body: { reportIds: string[] }
 */
export async function POST(request: Request) {
  try {
    // ── Auth (patient only) ─────────────────────────────────────────
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const reportIds: string[] = body.reportIds;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one report to share." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify all reportIds belong to this patient
    const ownedReports = await Report.find({
      reportId: { $in: reportIds },
      userId: payload.sub,
    })
      .select("reportId")
      .lean();

    const ownedIds = new Set(ownedReports.map((r) => r.reportId));
    const invalid = reportIds.filter((id) => !ownedIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { success: false, error: `Reports not found or not owned: ${invalid.join(", ")}` },
        { status: 403 }
      );
    }

    // Create share session (30-min TTL)
    const session = await ShareSession.create({
      patientUserId: payload.sub,
      selectedReportIds: reportIds,
    });

    return NextResponse.json({
      success: true,
      token: session.token,
      shareCode: session.shareCode,
      expiresAt: session.expiresAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create share session.";
    console.error("[share/create] error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

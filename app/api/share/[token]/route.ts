import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { ShareSession } from "@/models/ShareSession";
import { Report } from "@/models/Report";
import { User } from "@/models/User";

export const runtime = "nodejs";

/**
 * GET /api/share/[token]
 * Doctor resolves a share token to get the patient's profile + selected reports.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // ── Auth check: only doctors ────────────────────────────────────
    const authToken = await getTokenFromRequest();
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(authToken);
    const callerRole = (payload as { role?: string }).role;
    if (callerRole !== "doctor" && callerRole !== "admin") {
      return NextResponse.json({ error: "Forbidden – doctors only" }, { status: 403 });
    }

    const { token } = await params;

    await dbConnect();

    // ── Look up share session ───────────────────────────────────────
    const session = await ShareSession.findOne({
      $or: [{ token }, { shareCode: token }],
    }).lean();

    if (!session) {
      return NextResponse.json(
        { error: "Share link expired or invalid." },
        { status: 404 }
      );
    }

    // Check expiry (belt-and-braces — TTL index may have slight lag)
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This share link has expired. Ask the patient to generate a new QR." },
        { status: 410 }
      );
    }

    // ── Fetch patient profile ───────────────────────────────────────
    const patient = await User.findOne({ userId: session.patientUserId }).lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    // ── Fetch only the selected reports ─────────────────────────────
    const reports = await Report.find({
      reportId: { $in: session.selectedReportIds },
      userId: session.patientUserId,
    })
      .sort({ createdAt: -1 })
      .select("reportId fileName fileUrl rawText extractedData status createdAt")
      .lean();

    return NextResponse.json({
      success: true,
      patient: {
        userId: patient.userId,
        email: patient.email,
        fullName: patient.fullName,
        avatarUrl: patient.avatarUrl ?? null,
        phone: patient.phone ?? null,
        role: patient.role,
        status: patient.status,
        createdAt: patient.createdAt,
      },
      reports,
      expiresAt: session.expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[share/token] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

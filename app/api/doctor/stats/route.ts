import { NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { ShareSession } from "@/models/ShareSession";
import { Report } from "@/models/Report";

/**
 * GET /api/doctor/stats
 *
 * Returns real-time stats for the doctor dashboard:
 * - Total unique patients (from share sessions)
 * - Active share sessions (not yet expired)
 * - Total reports reviewed (from share sessions)
 * - Critical findings count (reports with critical keywords)
 */
export async function GET() {
  try {
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    const callerRole = (payload as { role?: string }).role;
    if (callerRole !== "doctor" && callerRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    // Total unique patients
    const uniquePatients = await ShareSession.distinct("patientUserId");
    const totalPatients = uniquePatients.length;

    // Active sessions (not expired)
    const activeSessions = await ShareSession.countDocuments({
      expiresAt: { $gt: new Date() },
    });

    // Total reports shared (all time)
    const allSessions = await ShareSession.find({})
      .select("selectedReportIds")
      .lean();
    const allReportIds = new Set<string>();
    for (const s of allSessions) {
      for (const id of s.selectedReportIds) {
        allReportIds.add(id);
      }
    }
    const totalReportsReviewed = allReportIds.size;

    // Critical findings - reports with critical keywords in extractedData or summary
    let criticalCount = 0;
    if (allReportIds.size > 0) {
      criticalCount = await Report.countDocuments({
        reportId: { $in: [...allReportIds] },
        $or: [
          { summary: { $regex: /critical|abnormal|high risk|urgent|danger/i } },
          {
            "extractedData.diagnosis": {
              $regex: /critical|abnormal|high risk|urgent|danger/i,
            },
          },
        ],
      });
    }

    // Today's sessions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = await ShareSession.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // This week's new patients
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPatientIds = await ShareSession.distinct("patientUserId", {
      createdAt: { $gte: weekAgo },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        newPatientsThisWeek: recentPatientIds.length,
        activeSessions,
        todaySessions,
        totalReportsReviewed,
        pendingReports: activeSessions, // active sessions = reports waiting
        criticalAlerts: criticalCount,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

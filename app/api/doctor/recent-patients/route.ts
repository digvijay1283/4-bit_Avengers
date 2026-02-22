import { NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { ShareSession } from "@/models/ShareSession";
import { User } from "@/models/User";

/**
 * GET /api/doctor/recent-patients
 *
 * Returns the most recent patients who shared reports with this doctor,
 * grouped by unique patient, sorted by most recent share date.
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

    // Aggregate: get unique patients from share sessions, most recent first
    const sessions = await ShareSession.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$patientUserId",
          lastSharedAt: { $first: "$createdAt" },
          shareCount: { $sum: 1 },
          totalReportsShared: {
            $first: { $size: "$selectedReportIds" },
          },
          lastToken: { $first: "$token" },
          lastShareCode: { $first: "$shareCode" },
        },
      },
      { $sort: { lastSharedAt: -1 } },
      { $limit: 20 },
    ]);

    // Fetch user details for all unique patient IDs
    const patientIds = sessions.map((s: { _id: string }) => s._id);
    const patients = await User.find({ userId: { $in: patientIds } })
      .select("userId fullName email avatarUrl phone status createdAt")
      .lean();

    const patientMap = new Map(
      patients.map((p) => [p.userId, p])
    );

    const result = sessions.map((s: {
      _id: string;
      lastSharedAt: Date;
      shareCount: number;
      totalReportsShared: number;
      lastToken: string;
      lastShareCode: string;
    }) => {
      const patient = patientMap.get(s._id);
      return {
        patientUserId: s._id,
        fullName: patient?.fullName ?? "Unknown Patient",
        email: patient?.email ?? "",
        avatarUrl: patient?.avatarUrl ?? null,
        phone: patient?.phone ?? null,
        status: patient?.status ?? "active",
        lastSharedAt: s.lastSharedAt,
        shareCount: s.shareCount,
        totalReportsShared: s.totalReportsShared,
        lastShareCode: s.lastShareCode,
      };
    });

    return NextResponse.json({ success: true, patients: result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

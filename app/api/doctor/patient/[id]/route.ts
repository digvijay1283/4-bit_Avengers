import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { HealthRecord } from "@/models/HealthRecord";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: only doctors ──
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    const callerRole = (payload as { role?: string }).role;
    if (callerRole !== "doctor" && callerRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: patientId } = await params;

    await dbConnect();

    // ── Fetch patient profile (exclude passwordHash) ──
    const patient = await User.findOne({ userId: patientId }).lean();
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // ── Fetch health records for the patient ──
    const records = await HealthRecord.find({ userId: patientId })
      .sort({ recordDate: -1 })
      .limit(50)
      .lean();

    // ── Group records by type ──
    const grouped: Record<string, typeof records> = {};
    for (const rec of records) {
      const key = rec.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(rec);
    }

    return NextResponse.json({
      patient: {
        userId: patient.userId,
        email: patient.email,
        fullName: patient.fullName,
        avatarUrl: patient.avatarUrl ?? null,
        phone: patient.phone ?? null,
        role: patient.role,
        status: patient.status,
        lastLoginAt: patient.lastLoginAt ?? null,
        createdAt: patient.createdAt,
      },
      records: grouped,
      totalRecords: records.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Medicine from "@/lib/models/Medicine";
import type { IMedicine } from "@/lib/models/Medicine";
import DoseLog from "@/lib/models/DoseLog";
import type { IDoseLog } from "@/lib/models/DoseLog";

/**
 * GET /api/doctor/patient/[id]/medicines
 *
 * Returns the patient's medicine list with adherence data.
 * Only accessible by doctor role.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: patientId } = await params;

    await dbConnect();

    // Fetch all medicines (both active and inactive) for the patient
    const medicines = await Medicine.find({ userId: patientId })
      .sort({ isActive: -1, updatedAt: -1 })
      .lean();

    // For each medicine, calculate adherence from dose logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const medicinesWithAdherence = await Promise.all(
      medicines.map(async (med: IMedicine) => {
        const logs = await DoseLog.find({
          medicineId: med._id.toString(),
          scheduledDate: { $gte: thirtyDaysAgoStr },
        }).lean() as IDoseLog[];

        const totalDoses = logs.length;
        const takenDoses = logs.filter((l: IDoseLog) => l.action === "taken").length;
        const missedDoses = logs.filter((l: IDoseLog) => l.action === "missed").length;
        const adherence =
          totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

        return {
          id: med._id.toString(),
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instruction: med.instruction,
          times: med.times,
          type: med.type,
          source: med.source,
          isActive: med.isActive,
          totalQuantity: med.totalQuantity,
          remainingQuantity: med.remainingQuantity,
          missedStreakCount: med.missedStreakCount,
          adherence,
          totalDoses,
          takenDoses,
          missedDoses,
          startDate: med.createdAt,
          status: med.isActive
            ? "active"
            : "discontinued",
        };
      })
    );

    return NextResponse.json({
      success: true,
      medicines: medicinesWithAdherence,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { HealthRecord } from "@/models/HealthRecord";

/**
 * GET /api/doctor/patient/[id]/vitals
 *
 * Returns the patient's latest vital signs from HealthRecord.
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

    // Get most recent vitals record
    const latestVitals = await HealthRecord.findOne({
      userId: patientId,
      type: "vitals",
    })
      .sort({ recordDate: -1 })
      .lean();

    // Get recent lab records
    const recentLabs = await HealthRecord.find({
      userId: patientId,
      type: "lab",
    })
      .sort({ recordDate: -1 })
      .limit(10)
      .lean();

    // Build vitals response from available data
    const vitalsData = latestVitals?.data as Record<string, unknown> | undefined;

    const vitals = [
      {
        label: "Heart Rate",
        value: vitalsData?.heartRate
          ? String(
              typeof vitalsData.heartRate === "object"
                ? (vitalsData.heartRate as { avg?: number }).avg ?? "--"
                : vitalsData.heartRate
            )
          : "--",
        unit: "bpm",
        icon: "Heart",
        color: "bg-red-50 text-red-500",
        status: getVitalStatus(
          "heartRate",
          vitalsData?.heartRate as number | undefined
        ),
      },
      {
        label: "Blood Pressure",
        value: vitalsData?.bloodPressure
          ? `${(vitalsData.bloodPressure as { systolic: number }).systolic}/${(vitalsData.bloodPressure as { diastolic: number }).diastolic}`
          : "--",
        unit: "mmHg",
        icon: "Activity",
        color: "bg-purple-50 text-purple-500",
        status: getVitalStatus(
          "bloodPressure",
          vitalsData?.bloodPressure as { systolic: number } | undefined
        ),
      },
      {
        label: "SpO₂",
        value: vitalsData?.spo2 ? String(vitalsData.spo2) : "--",
        unit: "%",
        icon: "Wind",
        color: "bg-teal-50 text-teal-500",
        status: getVitalStatus("spo2", vitalsData?.spo2 as number | undefined),
      },
      {
        label: "Steps",
        value: vitalsData?.steps ? String(vitalsData.steps) : "--",
        unit: "steps",
        icon: "Footprints",
        color: "bg-green-50 text-green-500",
        status: "normal" as const,
      },
      {
        label: "Sleep",
        value: vitalsData?.sleep
          ? `${Math.round(((vitalsData.sleep as { totalMinutes?: number }).totalMinutes ?? 0) / 60 * 10) / 10}`
          : "--",
        unit: "hrs",
        icon: "Moon",
        color: "bg-indigo-50 text-indigo-500",
        status: getVitalStatus(
          "sleep",
          vitalsData?.sleep as { totalMinutes?: number } | undefined
        ),
      },
      {
        label: "Risk Score",
        value: vitalsData?.riskScore
          ? String(vitalsData.riskScore)
          : "--",
        unit: "",
        icon: "ShieldAlert",
        color: "bg-amber-50 text-amber-500",
        status:
          vitalsData?.riskScore === "high"
            ? ("critical" as const)
            : vitalsData?.riskScore === "medium"
              ? ("warning" as const)
              : ("normal" as const),
      },
    ];

    return NextResponse.json({
      success: true,
      vitals,
      lastUpdated: latestVitals?.recordDate ?? null,
      recentLabs: recentLabs.map((lab) => ({
        id: lab._id.toString(),
        title: lab.title,
        summary: lab.summary,
        data: lab.data,
        date: lab.recordDate,
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getVitalStatus(
  type: string,
  value: unknown
): "normal" | "warning" | "critical" {
  if (!value || value === "--") return "normal";

  switch (type) {
    case "heartRate": {
      const hr =
        typeof value === "object"
          ? (value as { avg?: number }).avg ?? 0
          : (value as number);
      if (hr > 120 || hr < 45) return "critical";
      if (hr > 100 || hr < 50) return "warning";
      return "normal";
    }
    case "bloodPressure": {
      const bp = value as { systolic: number };
      if (bp.systolic > 180 || bp.systolic < 80) return "critical";
      if (bp.systolic > 140 || bp.systolic < 90) return "warning";
      return "normal";
    }
    case "spo2": {
      const spo2 = value as number;
      if (spo2 < 90) return "critical";
      if (spo2 < 95) return "warning";
      return "normal";
    }
    case "sleep": {
      const sleep = value as { totalMinutes?: number };
      const hours = ((sleep?.totalMinutes ?? 0) / 60);
      if (hours < 4) return "critical";
      if (hours < 6) return "warning";
      return "normal";
    }
    default:
      return "normal";
  }
}

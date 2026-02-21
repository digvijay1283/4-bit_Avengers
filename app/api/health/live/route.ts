import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/rbac";
import { HealthRecord } from "@/models/HealthRecord";

type HealthLiveResponse = {
  heartRate: number | null;
  bloodPressure: string | null;
  sleep: string | null;
  steps: number | null;
  riskScore: number | null;
  updatedAt: string | null;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toRiskScore(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    if (raw === "low") return 85;
    if (raw === "medium") return 60;
    if (raw === "high") return 35;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const latestVitals = await HealthRecord.findOne({
      userId: authUser.userId,
      type: "vitals",
    })
      .sort({ recordDate: -1, createdAt: -1 })
      .lean();

    if (!latestVitals) {
      const empty: HealthLiveResponse = {
        heartRate: null,
        bloodPressure: null,
        sleep: null,
        steps: null,
        riskScore: null,
        updatedAt: null,
      };
      return NextResponse.json({ ok: true, data: empty });
    }

    const data = (latestVitals.data ?? {}) as Record<string, unknown>;

    const heartRate =
      toNumber(data.heartRate) ??
      toNumber((data.heartRate as { avg?: unknown })?.avg) ??
      toNumber(data.bpm);

    const systolic = toNumber((data.bloodPressure as { systolic?: unknown })?.systolic);
    const diastolic = toNumber((data.bloodPressure as { diastolic?: unknown })?.diastolic);
    const bloodPressure =
      typeof data.bloodPressure === "string"
        ? data.bloodPressure
        : systolic !== null && diastolic !== null
          ? `${systolic}/${diastolic}`
          : null;

    const steps = toNumber(data.steps);

    const sleepMinutes =
      toNumber((data.sleep as { totalMinutes?: unknown })?.totalMinutes) ??
      toNumber(data.sleepMinutes);
    const sleepHours = toNumber(data.sleepHours);

    const sleep =
      sleepHours !== null
        ? `${sleepHours.toFixed(1)}h`
        : sleepMinutes !== null
          ? `${(sleepMinutes / 60).toFixed(1)}h`
          : null;

    const riskScore = toRiskScore(data.riskScore);

    const payload: HealthLiveResponse = {
      heartRate,
      bloodPressure,
      sleep,
      steps,
      riskScore,
      updatedAt: latestVitals.updatedAt
        ? new Date(latestVitals.updatedAt).toISOString()
        : null,
    };

    return NextResponse.json({ ok: true, data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: "Failed to fetch live health data", error: message },
      { status: 500 }
    );
  }
}

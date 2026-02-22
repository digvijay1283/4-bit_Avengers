import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Medicine from "@/lib/models/Medicine";
import DoseLog from "@/lib/models/DoseLog";

// ─── POST /api/medicines/[id]/dose — record a dose action (taken/snoozed/missed/skipped) ──
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getTokenFromRequest();
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    const body = await req.json();
    const { action, scheduledTime, snoozeMinutes } = body as {
      action: "taken" | "snoozed" | "missed" | "skipped";
      scheduledTime: string; // "09:00"
      snoozeMinutes?: number;
    };

    if (!action || !scheduledTime) {
      return NextResponse.json(
        { error: "action and scheduledTime are required" },
        { status: 400 }
      );
    }

    // Verify the medicine belongs to this user
    const medicine = await Medicine.findOne({
      _id: id,
      userId: payload.sub,
    });
    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const minutesToSnooze =
      typeof snoozeMinutes === "number" && snoozeMinutes > 0
        ? snoozeMinutes
        : 5;

    const snoozedUntil =
      action === "snoozed"
        ? new Date(Date.now() + minutesToSnooze * 60 * 1000)
        : null;

    // Upsert the dose log for this time slot today
    const doseLog = await DoseLog.findOneAndUpdate(
      {
        medicineId: id,
        scheduledDate: today,
        scheduledTime,
      },
      {
        $set: {
          userId: payload.sub,
          action,
          actionAt: new Date(),
          snoozedUntil,
        },
      },
      { upsert: true, new: true }
    );

    // Update medicine counters
    if (action === "taken") {
      await Medicine.findByIdAndUpdate(id, {
        $set: { missedStreakCount: 0 },
        $inc: { remainingQuantity: -1 },
      });
    } else if (action === "missed") {
      await Medicine.findByIdAndUpdate(id, {
        $inc: { missedStreakCount: 1 },
      });
    } else if (action === "snoozed") {
      // no counter change — snooze is temporary
    } else if (action === "skipped") {
      // Reset streak on intentional skip (different from accidental miss)
      await Medicine.findByIdAndUpdate(id, {
        $set: { missedStreakCount: 0 },
      });
    }

    // Re-read medicine for updated missedStreakCount
    const updated = await Medicine.findById(id).lean();

    return NextResponse.json({
      success: true,
      doseLog,
      missedStreakCount: updated?.missedStreakCount ?? 0,
    });
  } catch (err) {
    console.error("POST /api/medicines/[id]/dose error:", err);
    return NextResponse.json(
      { error: "Failed to log dose" },
      { status: 500 }
    );
  }
}

// ─── GET /api/medicines/[id]/dose — get today's dose logs for a medicine ─────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getTokenFromRequest();
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    const today = new Date().toISOString().slice(0, 10);
    const logs = await DoseLog.find({
      medicineId: id,
      userId: payload.sub,
      scheduledDate: today,
    }).lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (err) {
    console.error("GET /api/medicines/[id]/dose error:", err);
    return NextResponse.json(
      { error: "Failed to fetch dose logs" },
      { status: 500 }
    );
  }
}

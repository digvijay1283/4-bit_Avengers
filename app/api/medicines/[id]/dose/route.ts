import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Medicine from "@/lib/models/Medicine";
import DoseLog from "@/lib/models/DoseLog";
import { User } from "@/models/User";
import twilio from "twilio";

const MISSED_ALERT_THRESHOLD = 5;

function normalizeE164(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

async function triggerGuardianCall(params: {
  userId: string;
  userName: string;
  medicineName: string;
  missedCount: number;
}) {
  const user = await User.findOne({ userId: params.userId }).lean();
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const guardianName = user.emergencyContactName || "Guardian";
  const guardianPhone = normalizeE164(user.emergencyContactPhone);
  if (!guardianPhone) {
    return {
      success: false,
      needsSetup: true,
      error: "No emergency contact phone configured",
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = normalizeE164(process.env.TWILIO_PHONE_NUMBER);
  if (!accountSid || !authToken || !twilioPhone) {
    return { success: false, error: "Twilio is not configured" };
  }

  const response = new twilio.twiml.VoiceResponse();
  response.say(
    { voice: "Polly.Joanna", language: "en-US" },
    `Hello ${guardianName}. This is an automated health alert from Vital AI.`
  );
  response.pause({ length: 1 });
  response.say(
    { voice: "Polly.Joanna", language: "en-US" },
    `Cause of this call: ${params.userName} has missed ${params.medicineName} ${params.missedCount} times in a row. Please check immediately.`
  );

  const client = twilio(accountSid, authToken);
  const call = await client.calls.create({
    twiml: response.toString(),
    to: guardianPhone,
    from: twilioPhone,
  });

  return {
    success: true,
    callSid: call.sid,
    callStatus: call.status,
    guardianPhone,
  };
}

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

    let guardianAlert:
      | {
          triggered: boolean;
          success?: boolean;
          callSid?: string;
          callStatus?: string;
          error?: string;
          needsSetup?: boolean;
        }
      | undefined;

    if (
      action === "missed" &&
      (updated?.missedStreakCount ?? 0) === MISSED_ALERT_THRESHOLD
    ) {
      try {
        const callResult = await triggerGuardianCall({
          userId: payload.sub,
          userName: payload.fullName ?? "The patient",
          medicineName: medicine.name ?? "the medicine",
          missedCount: MISSED_ALERT_THRESHOLD,
        });

        guardianAlert = {
          triggered: true,
          success: callResult.success,
          callSid: "callSid" in callResult ? callResult.callSid : undefined,
          callStatus: "callStatus" in callResult ? callResult.callStatus : undefined,
          error: "error" in callResult ? callResult.error : undefined,
          needsSetup: "needsSetup" in callResult ? callResult.needsSetup : undefined,
        };

        if (callResult.success) {
          console.log(
            `[GuardianAlert] Auto-call triggered from dose route. SID=${callResult.callSid}, medicine=${medicine.name}`
          );
        } else {
          console.warn(
            `[GuardianAlert] Auto-call not placed. reason=${callResult.error}`
          );
        }
      } catch (callErr) {
        const message =
          callErr instanceof Error ? callErr.message : "Failed to place guardian call";
        guardianAlert = {
          triggered: true,
          success: false,
          error: message,
        };
        console.error("[GuardianAlert] Auto-call error:", callErr);
      }
    }

    return NextResponse.json({
      success: true,
      doseLog,
      missedStreakCount: updated?.missedStreakCount ?? 0,
      guardianAlert,
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

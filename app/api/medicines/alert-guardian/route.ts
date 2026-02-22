import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import twilio from "twilio";

/**
 * POST /api/medicines/alert-guardian
 * Triggered when a user misses consecutive medicine alarms.
 * Makes a one-way voice call to the user's emergency contact (guardian).
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    await dbConnect();

    const body = await req.json();
    const { medicineName, missedCount } = body as {
      medicineName?: string;
      missedCount?: number;
    };

    if (!medicineName) {
      return NextResponse.json({
        success: false,
        error: "medicineName is required",
      }, { status: 400 });
    }

    const user = await User.findOne({ userId: payload.sub }).lean();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    const guardianPhone = user.emergencyContactPhone;
    const guardianName = user.emergencyContactName || "Guardian";
    const userName = user.fullName || "The patient";

    if (!guardianPhone) {
      return NextResponse.json({
        success: false,
        error:
          "No emergency contact phone number configured. Please update profile.",
        needsSetup: true,
      }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json({
        success: false,
        error: "Voice call service is not configured",
      }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    const response = new twilio.twiml.VoiceResponse();
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      `Hello ${guardianName}. This is an automated health alert from Vital AI.`
    );
    response.pause({ length: 1 });
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      `Cause of this call: ${userName} has not taken ${medicineName}. You need to look into this matter immediately.`
    );
    response.pause({ length: 1 });
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      `Repeating the cause: ${userName} has not taken ${medicineName}. Please check now. Thank you.`
    );

    const voiceMessage = response.toString();

    const call = await client.calls.create({
      twiml: voiceMessage,
      to: guardianPhone,
      from: twilioPhone,
    });

    console.log(
      `[GuardianAlert] Call initiated: SID=${call.sid}, to=${guardianPhone}, medicine=${medicineName}, missedCount=${missedCount ?? 0}`
    );

    const maskedPhone = guardianPhone.replace(/(\+\d{2})\d*(\d{4})/, "$1****$2");

    return NextResponse.json({
      success: true,
      guardianName,
      guardianPhone: maskedPhone,
      callSid: call.sid,
      callStatus: call.status,
      message: `Voice alert call initiated to ${guardianName} (${maskedPhone})`,
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: number; status?: number };
    console.error("[GuardianAlert] Error:", err);

    return NextResponse.json({
      success: false,
      error: err.message || "Failed to initiate guardian alert call",
      code: err.code,
    }, { status: err.status || 500 });
  }
}

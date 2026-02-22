import { NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import twilio from "twilio";

function normalizeE164(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

function maskPhone(phone: string) {
  return phone.replace(/(\+\d{2})\d*(\d{4})/, "$1****$2");
}

export async function POST() {
  try {
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ userId: payload.sub }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const guardianName = user.emergencyContactName || "Guardian";
    const guardianPhone = normalizeE164(user.emergencyContactPhone);
    if (!guardianPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "No emergency contact phone configured.",
          needsSetup: true,
        },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = normalizeE164(process.env.TWILIO_PHONE_NUMBER);

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Twilio credentials are not configured.",
        },
        { status: 500 }
      );
    }

    const response = new twilio.twiml.VoiceResponse();
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      `Hello ${guardianName}. This is a test call from Vital AI to verify guardian voice alerts are working.`
    );
    response.pause({ length: 1 });
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "No action is required. This was only a system test."
    );

    const client = twilio(accountSid, authToken);
    const call = await client.calls.create({
      twiml: response.toString(),
      to: guardianPhone,
      from: twilioPhone,
    });

    return NextResponse.json({
      success: true,
      message: "Guardian test call initiated.",
      callSid: call.sid,
      callStatus: call.status,
      to: maskPhone(guardianPhone),
      from: maskPhone(twilioPhone),
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: number; status?: number; moreInfo?: string };
    console.error("[GuardianTestCall] Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to initiate guardian test call",
        twilioCode: err.code,
        httpStatus: err.status,
        moreInfo: err.moreInfo,
      },
      { status: err.status || 500 }
    );
  }
}

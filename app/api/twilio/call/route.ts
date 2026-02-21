import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json(
        { error: "Twilio credentials are not configured" },
        { status: 500 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Use a custom TwiML URL if a message is provided, otherwise use the Twilio demo
    const twimlUrl = message
      ? `https://handler.twilio.com/twiml/EH_PLACEHOLDER?Message=${encodeURIComponent(message)}`
      : "http://demo.twilio.com/docs/voice.xml";

    const call = await client.calls.create({
      url: twimlUrl,
      to,
      from: twilioPhone,
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: number; status?: number };
    console.error("Twilio call error:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to initiate call",
        code: err.code,
      },
      { status: err.status || 500 }
    );
  }
}

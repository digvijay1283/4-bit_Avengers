import { NextResponse } from "next/server";

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  return NextResponse.json({
    configured: !!(accountSid && authToken && twilioPhone),
    phoneNumber: twilioPhone ?? null,
  });
}

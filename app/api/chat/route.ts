import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const WEBHOOK_URL = process.env.CHATBOT_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  throw new Error("CHATBOT_WEBHOOK_URL is not set in environment variables.");
}

const WEBHOOK = WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      chatId?: string;
      sessionId?: string;
      userChat?: string;
    };

    const userId = body.userId ?? "anonymous";
    const chatId = body.chatId ?? randomUUID();
    const sessionId = body.sessionId ?? randomUUID();
    const userChat = body.userChat?.trim();

    if (!userChat) {
      return NextResponse.json(
        { ok: false, message: "userChat is required." },
        { status: 400 }
      );
    }

    // Forward to external webhook
    const webhookRes = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId, sessionId, userChat }),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text();
      return NextResponse.json(
        { ok: false, message: "Webhook error.", error: errText },
        { status: 502 }
      );
    }

    const data = (await webhookRes.json()) as { output?: string } | { output?: string }[];

    // Webhook may return an array or single object — normalise
    const output = Array.isArray(data)
      ? data.map((d) => d.output).join("")
      : data.output ?? "";

    return NextResponse.json(
      { ok: true, chatId, sessionId, output },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: "Chat request failed.", error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 *
 * Handles a user message and returns the bot's response via the
 * cavista-mental-chatbot webhook.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/rbac";

// ── Fallback responses (used when CHATBOT_WEBHOOK_URL is not configured) ─────
const FALLBACK_RESPONSES: Record<string, string[]> = {
  greet: [
    "Hi there! I'm VitalAI, your health companion. I'm here to help with anything health-related — medications, symptoms, wellness tips, and more!",
  ],
  headache: [
    "Headaches can have many causes — dehydration, stress, poor sleep, or eye strain are the most common.\n\n**Quick steps to try:**\n- Drink a glass of water\n- Rest in a quiet, dark room for 15–20 minutes\n- Apply a cool cloth to your forehead\n\nIf headaches are frequent or severe, please consult a doctor.",
  ],
  sleep: [
    "Sleep is foundational to your health. For better sleep quality:\n\n- Stick to a consistent sleep schedule\n- Avoid caffeine after 2 pm\n- Keep your room cool and dark\n- Avoid screens 30 minutes before bed\n\nAiming for 7–9 hours is ideal for most adults.",
  ],
  stress: [
    "Stress management is crucial for long-term health. Effective techniques include:\n\n- **Box breathing**: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s\n- 10–15 min daily walks\n- Journaling for 5 minutes before bed\n- Progressive muscle relaxation\n\nWould you like me to walk you through any of these?",
  ],
  medication: [
    "For medication questions, accuracy is very important. I can provide general information, but always verify with your pharmacist or prescribing doctor.\n\n**General tips:**\n- Take medications at the same time daily\n- Don't skip doses without consulting your doctor\n- Store as directed on the label\n\nWhat specific medication would you like to know about?",
  ],
  diet: [
    "Good nutrition is one of the most powerful health tools. A balanced plate typically includes:\n\n- **50%** vegetables & fruits\n- **25%** lean protein (chicken, fish, legumes)\n- **25%** whole grains\n\nStaying hydrated (8 glasses/day) and limiting processed foods makes a huge difference.",
  ],
  exercise: [
    "Regular movement is medicine. Even modest exercise has profound benefits:\n\n- **150 min/week** of moderate cardio (brisk walking counts!)\n- **2×/week** strength training\n- Stretching daily for flexibility\n\nStart small — a 10-minute walk every day is far better than nothing.",
  ],
  heart: [
    "Heart health is all about consistency:\n\n- Monitor blood pressure regularly (aim <120/80)\n- Limit sodium and saturated fats\n- Exercise regularly\n- Don't smoke\n- Manage stress\n\nIf you experience chest pain, shortness of breath, or palpitations, seek medical attention immediately.",
  ],
  default: [
    "That's a great question! I'm here to help with health, wellness, medications, and lifestyle. Could you give me a bit more detail so I can give you the most helpful response?",
    "I want to make sure I give you accurate information. Could you tell me more about what you're experiencing or asking about?",
    "Thanks for reaching out! I'm your VitalAI health companion. Feel free to ask about symptoms, medications, nutrition, sleep, exercise, or mental wellness.",
  ],
};

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const [topic, responses] of Object.entries(FALLBACK_RESPONSES)) {
    if (topic === "default") continue;
    if (lower.includes(topic)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  if (/\b(hi|hello|hey|howdy|good\s*(morning|evening|afternoon))\b/.test(lower)) {
    return FALLBACK_RESPONSES.greet[0];
  }
  const defaults = FALLBACK_RESPONSES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const authUser = await getAuthUser();
    const resolvedUserId = authUser?.userId ?? "anonymous";

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = (await request.json()) as {
      userId?: string;
      chatId?: string;
      userChat?: string;
      summary?: string;
    };

    const userId = body.userId ?? resolvedUserId;
    const chatId = body.chatId ?? randomUUID();
    const userChat = body.userChat?.trim();
    const summary = body.summary ?? "";

    if (!userChat) {
      return NextResponse.json(
        { ok: false, message: "userChat is required." },
        { status: 400 }
      );
    }

    // ── Call the mental chatbot webhook ────────────────────────────────────
    const WEBHOOK = "https://synthomind.cloud/webhook/cavista-mental-chatbot";
    let output = "";
    let audio = "";

    try {
      const webhookRes = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, userId, userChat, summary }),
      });
      if (webhookRes.ok) {
        const data = (await webhookRes.json()) as
          | { output?: string; reply?: string; audio?: string }
          | { output?: string; reply?: string; audio?: string }[];
        if (Array.isArray(data)) {
          output = data.map((d) => d.reply ?? d.output ?? "").join("");
          audio = data[0]?.audio ?? "";
        } else {
          output = data.reply ?? data.output ?? "";
          audio = data.audio ?? "";
        }
      } else {
        output = getFallbackResponse(userChat);
      }
    } catch {
      output = getFallbackResponse(userChat);
    }

    return NextResponse.json(
      { ok: true, chatId, output, audio },
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

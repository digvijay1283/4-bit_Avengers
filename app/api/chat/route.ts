/**
 * POST /api/chat
 *
 * Handles a user message and returns the bot's response.
 * Integrates with the proactive-session system:
 *   1. Cancels any pending proactive timer (user beat the bot — corner case)
 *   2. Marks user as active and clears "waiting for reply" gate
 *   3. Returns the bot response (webhook if configured, fallback otherwise)
 *   4. Schedules one proactive message (5–10s delay), then waits for user reply
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/rbac";
import {
  getOrCreateSession,
  cancelProactiveTimer,
  scheduleProactiveMessage,
} from "@/lib/chatSessions";

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
    const userName = authUser?.fullName ?? "there";
    const resolvedUserId = authUser?.userId ?? "anonymous";

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = (await request.json()) as {
      userId?: string;
      chatId?: string;
      sessionId?: string;
      userChat?: string;
    };

    const userId = body.userId ?? resolvedUserId;
    const chatId = body.chatId ?? randomUUID();
    const sessionId = body.sessionId ?? randomUUID();
    const userChat = body.userChat?.trim();

    if (!userChat) {
      return NextResponse.json(
        { ok: false, message: "userChat is required." },
        { status: 400 }
      );
    }

    // ── Session management ─────────────────────────────────────────────────
    const session = getOrCreateSession(sessionId, userId, userName);

    // CORNER CASE: user sent a message before the scheduled proactive push
    // → cancel so we don't send a bot message on top of this exchange
    cancelProactiveTimer(sessionId);

    session.userLastActiveAt = Date.now();
    session.interactionCount += 1;
    session.waitingForUserAfterProactive = false;

    // ── Get bot response ───────────────────────────────────────────────────
    let output = "";
    const WEBHOOK = process.env.CHATBOT_WEBHOOK_URL;

    if (WEBHOOK) {
      try {
        const webhookRes = await fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, userId, sessionId, userChat }),
        });
        if (webhookRes.ok) {
          const data = (await webhookRes.json()) as
            | { output?: string }
            | { output?: string }[];
          output = Array.isArray(data)
            ? data.map((d) => d.output ?? "").join("")
            : (data.output ?? "");
        } else {
          output = getFallbackResponse(userChat);
        }
      } catch {
        output = getFallbackResponse(userChat);
      }
    } else {
      output = getFallbackResponse(userChat);
    }

    // ── Schedule a single proactive message after each bot response ────────
    scheduleProactiveMessage(sessionId);

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

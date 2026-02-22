/**
 * POST /api/chat
 *
 * Handles a user message and returns the bot's response via the
 * cavista-mental-chatbot webhook.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/rbac";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import twilio from "twilio";

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

const SELF_HARM_KEYS = new Set([
  "selfharmalert",
  "selfharm",
  "selfharmrisk",
  "selfharmdetected",
  "suiciderisk",
  "suicidealert",
  "crisisalert",
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isTruthyAlertValue(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "y";
  }
  return false;
}

function hasSelfHarmAlertFlag(payload: unknown, depth = 0): boolean {
  if (depth > 5 || payload == null) return false;

  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return false;

    const lowered = text.toLowerCase();
    if (
      /self\s*[-_ ]?harm\s*[-_ ]?(alert|risk|detected)?\s*[:=]\s*(true|1|yes)/i.test(
        lowered
      ) ||
      /suicide\s*[-_ ]?(alert|risk)?\s*[:=]\s*(true|1|yes)/i.test(lowered) ||
      /crisis\s*[-_ ]?alert\s*[:=]\s*(true|1|yes)/i.test(lowered)
    ) {
      return true;
    }

    if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
      try {
        const parsed = JSON.parse(text);
        return hasSelfHarmAlertFlag(parsed, depth + 1);
      } catch {
        return false;
      }
    }

    return false;
  }

  if (Array.isArray(payload)) {
    return payload.some((item) => hasSelfHarmAlertFlag(item, depth + 1));
  }

  if (typeof payload !== "object") return false;

  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const normalized = normalizeKey(key);
    if (SELF_HARM_KEYS.has(normalized) && isTruthyAlertValue(value)) {
      return true;
    }
    if (typeof value === "object" && value !== null) {
      if (hasSelfHarmAlertFlag(value, depth + 1)) return true;
    }
  }

  return false;
}

function extractChatOutputAndAudio(payload: unknown): { output: string; audio: string } {
  if (Array.isArray(payload)) {
    const output = payload
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const obj = entry as Record<string, unknown>;
        return String(obj.reply ?? obj.output ?? "");
      })
      .join("");

    const first = payload[0];
    let audio = "";
    if (first && typeof first === "object") {
      audio = String((first as Record<string, unknown>).audio ?? "");
    }
    return { output, audio };
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    return {
      output: String(obj.reply ?? obj.output ?? ""),
      audio: String(obj.audio ?? ""),
    };
  }

  if (typeof payload === "string") {
    return { output: payload, audio: "" };
  }

  return { output: "", audio: "" };
}

function normalizeE164(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

async function triggerGuardianCallForSelfHarm(params: {
  userId: string;
  userName: string;
}) {
  await dbConnect();

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
    return {
      success: false,
      error: "Twilio credentials are not configured",
    };
  }

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(
    { voice: "Polly.Joanna", language: "en-US" },
    `Hello ${guardianName}. This is an urgent safety alert from Vital AI.`
  );
  twiml.pause({ length: 1 });
  twiml.say(
    { voice: "Polly.Joanna", language: "en-US" },
    `${params.userName} may need immediate support. Please contact them right away.`
  );

  const client = twilio(accountSid, authToken);
  const call = await client.calls.create({
    twiml: twiml.toString(),
    to: guardianPhone,
    from: twilioPhone,
  });

  return {
    success: true,
    callSid: call.sid,
    callStatus: call.status,
  };
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
    let selfHarmAlertTriggered = false;
    let guardianAlert:
      | {
          success: boolean;
          callSid?: string;
          callStatus?: string;
          error?: string;
          needsSetup?: boolean;
        }
      | undefined;

    try {
      const webhookRes = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, userId, userChat, summary }),
      });
      if (webhookRes.ok) {
        const raw = await webhookRes.text();
        let parsed: unknown = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // non-JSON webhook payload
        }

        selfHarmAlertTriggered =
          hasSelfHarmAlertFlag(parsed) || hasSelfHarmAlertFlag(raw);

        const extracted = extractChatOutputAndAudio(parsed);
        output = extracted.output;
        audio = extracted.audio;

        if (!output && typeof raw === "string") {
          output = raw;
        }
      } else {
        output = getFallbackResponse(userChat);
      }
    } catch {
      output = getFallbackResponse(userChat);
    }

    const callUserId = authUser?.userId ?? (userId !== "anonymous" ? userId : undefined);

    if (selfHarmAlertTriggered && callUserId) {
      try {
        const callResult = await triggerGuardianCallForSelfHarm({
          userId: callUserId,
          userName: authUser.fullName || "The patient",
        });

        guardianAlert = {
          success: callResult.success,
          callSid: "callSid" in callResult ? callResult.callSid : undefined,
          callStatus: "callStatus" in callResult ? callResult.callStatus : undefined,
          error: "error" in callResult ? callResult.error : undefined,
          needsSetup: "needsSetup" in callResult ? callResult.needsSetup : undefined,
        };

        if (callResult.success) {
          console.warn(
            `[SelfHarmAlert] Guardian call initiated for userId=${callUserId}, callSid=${callResult.callSid}`
          );
        } else {
          console.error(
            `[SelfHarmAlert] Guardian call failed for userId=${callUserId}. reason=${callResult.error}`
          );
        }
      } catch (callErr) {
        const message =
          callErr instanceof Error ? callErr.message : "Failed to initiate guardian call";
        guardianAlert = {
          success: false,
          error: message,
        };
        console.error("[SelfHarmAlert] Exception while placing guardian call:", callErr);
      }
    } else if (selfHarmAlertTriggered && !callUserId) {
      guardianAlert = {
        success: false,
        error: "Self-harm alert detected but no authenticated user context was available for guardian calling.",
      };
      console.error("[SelfHarmAlert] Triggered but no user context available");
    }

    return NextResponse.json(
      {
        ok: true,
        chatId,
        output,
        audio,
        selfHarmAlertTriggered,
        guardianAlert,
      },
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

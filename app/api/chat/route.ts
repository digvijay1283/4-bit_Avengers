/**
 * POST /api/chat
 *
 * Handles a user message and returns the chatbot response.
 * When webhook output marks `alert=true`, this route also places a care call
 * to the user's configured guardian/caregiver.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import twilio from "twilio";
import { getAuthUser } from "@/lib/rbac";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

type ChatWebhookRow = {
  output?: string;
  reply?: string;
  audio?: string;
  alert?: unknown;
  ConfidenceScore?: unknown;
  confidenceScore?: unknown;
};

type ParsedWebhookPayload = {
  output: string;
  audio: string;
  alert: boolean;
  confidenceScore: number | null;
};

type GuardianCallResult = {
  attempted: boolean;
  called: boolean;
  reason?: string;
  guardianName?: string;
  guardianPhone?: string;
  callSid?: string;
  callStatus?: string;
  careMessage: string;
  error?: string;
};

const CHATBOT_WEBHOOK = "https://synthomind.cloud/webhook/cavista-mental-chatbot";

const ALERT_TRUE_VALUES = new Set([
  "true",
  "1",
  "yes",
  "y",
  "alert",
  "high",
  "critical",
]);

const FALLBACK_RESPONSES: Record<string, string[]> = {
  greet: [
    "Hi there! I'm VitalAI, your health companion. I'm here to help with anything health-related like medications, symptoms, wellness tips, and more.",
  ],
  headache: [
    "Headaches can have many causes like dehydration, stress, poor sleep, or eye strain.\n\nQuick steps to try:\n- Drink a glass of water\n- Rest in a quiet, dark room for 15 to 20 minutes\n- Apply a cool cloth to your forehead\n\nIf headaches are frequent or severe, please consult a doctor.",
  ],
  sleep: [
    "Sleep is foundational to your health. For better sleep quality:\n\n- Keep a consistent sleep schedule\n- Avoid caffeine after 2 PM\n- Keep your room cool and dark\n- Avoid screens for 30 minutes before bed\n\nAiming for 7 to 9 hours is ideal for most adults.",
  ],
  stress: [
    "Stress management is crucial for long-term health. Helpful techniques include:\n\n- Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s\n- 10 to 15 minute daily walks\n- Journaling for 5 minutes before bed\n- Progressive muscle relaxation\n\nWould you like me to guide you through one now?",
  ],
  medication: [
    "For medication questions, accuracy is very important. I can provide general information, but always verify with your pharmacist or prescribing doctor.\n\nGeneral tips:\n- Take medications at the same time daily\n- Do not skip doses without consulting your doctor\n- Store medicines as directed on the label\n\nWhat specific medication would you like to ask about?",
  ],
  diet: [
    "Good nutrition is one of the most powerful health tools. A balanced plate often includes:\n\n- 50% vegetables and fruits\n- 25% lean protein (chicken, fish, legumes)\n- 25% whole grains\n\nStaying hydrated and limiting processed foods makes a big difference.",
  ],
  exercise: [
    "Regular movement helps every part of your health:\n\n- 150 min per week of moderate cardio\n- Strength training 2 times per week\n- Daily stretching for flexibility\n\nStart small and stay consistent.",
  ],
  heart: [
    "Heart health improves with steady habits:\n\n- Monitor blood pressure regularly\n- Limit sodium and saturated fats\n- Exercise consistently\n- Avoid smoking\n- Manage stress\n\nIf you experience chest pain or severe shortness of breath, seek immediate medical care.",
  ],
  default: [
    "Thanks for reaching out. I can help with health, wellness, medications, and lifestyle questions. Could you share a little more detail so I can help better?",
    "I want to give you accurate guidance. Can you tell me more about what you're experiencing?",
    "I'm here to support you. Ask me about symptoms, medications, nutrition, sleep, exercise, or mental wellness.",
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

function parseAlertFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;

  return ALERT_TRUE_VALUES.has(value.trim().toLowerCase());
}

function parseConfidenceScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value <= 1) return value;
    if (value > 1 && value <= 100) return value / 100;
    return null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    if (!Number.isFinite(parsed)) return null;
    if (parsed >= 0 && parsed <= 1) return parsed;
    if (parsed > 1 && parsed <= 100) return parsed / 100;
  }

  return null;
}

function normalizeWebhookPayload(payload: unknown): ParsedWebhookPayload {
  if (typeof payload === "string") {
    return {
      output: payload.trim(),
      audio: "",
      alert: false,
      confidenceScore: null,
    };
  }

  const rows: ChatWebhookRow[] = Array.isArray(payload)
    ? payload.filter((item): item is ChatWebhookRow => item !== null && typeof item === "object")
    : payload && typeof payload === "object"
      ? [payload as ChatWebhookRow]
      : [];

  const replies: string[] = [];
  let audio = "";
  let alert = false;
  let confidenceScore: number | null = null;

  for (const row of rows) {
    const replyText =
      typeof row.reply === "string"
        ? row.reply.trim()
        : typeof row.output === "string"
          ? row.output.trim()
          : "";

    if (replyText) replies.push(replyText);

    if (!audio && typeof row.audio === "string" && row.audio.trim() !== "") {
      audio = row.audio;
    }

    if (parseAlertFlag(row.alert)) {
      alert = true;
    }

    const currentScore = parseConfidenceScore(
      row.ConfidenceScore ?? row.confidenceScore
    );
    if (currentScore !== null) {
      confidenceScore =
        confidenceScore === null
          ? currentScore
          : Math.max(confidenceScore, currentScore);
    }
  }

  return {
    output: replies.join("\n\n"),
    audio,
    alert,
    confidenceScore,
  };
}

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  const intlMasked = trimmed.replace(/(\+\d{1,3})\d*(\d{4})/, "$1****$2");
  if (intlMasked !== trimmed) return intlMasked;
  return trimmed.replace(/\d(?=\d{4})/g, "*");
}

function buildCareMessageSegments(params: {
  guardianName: string;
  patientName: string;
  confidenceScore: number | null;
}): string[] {
  const { guardianName, patientName, confidenceScore } = params;
  const scoredLine =
    typeof confidenceScore === "number"
      ? `Our monitoring confidence for concern is ${Math.round(
          confidenceScore * 100
        )} percent, but your personal judgment is most important.`
      : null;

  const lines = [
    `Hello ${guardianName}. This is VitalAI Care Support.`,
    `I am calling because ${patientName} may be emotionally distressed and could need support right now.`,
    `Please check on ${patientName} as soon as possible. Speak calmly, listen with care, and stay connected with them.`,
    "If you think there is immediate danger, call emergency services now. In the United States, you can also call or text 988 for crisis support.",
    "Thank you for being there. Your support can make a real difference.",
  ];

  if (scoredLine) lines.splice(4, 0, scoredLine);
  return lines;
}

function buildCareMessageText(params: {
  guardianName: string;
  patientName: string;
  confidenceScore: number | null;
}): string {
  return buildCareMessageSegments(params).join(" ");
}

function buildCareCallTwiml(params: {
  guardianName: string;
  patientName: string;
  confidenceScore: number | null;
}): string {
  const segments = buildCareMessageSegments(params);
  const response = new twilio.twiml.VoiceResponse();

  segments.forEach((segment, index) => {
    response.say({ voice: "Polly.Joanna", language: "en-US" }, segment);
    if (index < segments.length - 1) {
      response.pause({ length: 1 });
    }
  });

  return response.toString();
}

async function callGuardianForChatAlert(params: {
  userId: string | null;
  fallbackUserName: string;
  confidenceScore: number | null;
}): Promise<GuardianCallResult> {
  const fallbackPatientName = params.fallbackUserName || "your loved one";
  const fallbackCareMessage = buildCareMessageText({
    guardianName: "Guardian",
    patientName: fallbackPatientName,
    confidenceScore: params.confidenceScore,
  });

  if (!params.userId || params.userId === "anonymous" || params.userId === "guest") {
    return {
      attempted: false,
      called: false,
      reason: "user_not_authenticated",
      careMessage: fallbackCareMessage,
    };
  }

  try {
    await dbConnect();

    const user = await User.findOne({ userId: params.userId }).lean<{
      fullName?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }>();

    if (!user) {
      return {
        attempted: false,
        called: false,
        reason: "user_not_found",
        careMessage: fallbackCareMessage,
      };
    }

    const guardianName = user.emergencyContactName?.trim() || "Guardian";
    const guardianPhone = user.emergencyContactPhone?.trim();
    const patientName = user.fullName?.trim() || fallbackPatientName;
    const careMessage = buildCareMessageText({
      guardianName,
      patientName,
      confidenceScore: params.confidenceScore,
    });

    if (!guardianPhone) {
      return {
        attempted: false,
        called: false,
        reason: "guardian_phone_missing",
        guardianName,
        careMessage,
      };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return {
        attempted: false,
        called: false,
        reason: "twilio_not_configured",
        guardianName,
        guardianPhone: maskPhone(guardianPhone),
        careMessage,
      };
    }

    const client = twilio(accountSid, authToken);
    const twiml = buildCareCallTwiml({
      guardianName,
      patientName,
      confidenceScore: params.confidenceScore,
    });

    const call = await client.calls.create({
      twiml,
      to: guardianPhone,
      from: twilioPhone,
    });

    return {
      attempted: true,
      called: true,
      guardianName,
      guardianPhone: maskPhone(guardianPhone),
      callSid: call.sid,
      callStatus: call.status,
      careMessage,
    };
  } catch (error) {
    const err = error as Error;
    return {
      attempted: true,
      called: false,
      reason: "call_failed",
      careMessage: fallbackCareMessage,
      error: err.message || "Failed to place guardian call",
    };
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const resolvedUserId = authUser?.userId ?? "anonymous";
    const resolvedUserName = authUser?.fullName ?? "";

    const body = (await request.json()) as {
      userId?: string;
      chatId?: string;
      userChat?: string;
      summary?: string;
    };

    const userId = authUser?.userId ?? body.userId ?? resolvedUserId;
    const chatId = body.chatId ?? randomUUID();
    const userChat = body.userChat?.trim();
    const summary = body.summary ?? "";

    if (!userChat) {
      return NextResponse.json(
        { ok: false, message: "userChat is required." },
        { status: 400 }
      );
    }

    let output = "";
    let audio = "";
    let alert = false;
    let confidenceScore: number | null = null;

    try {
      const webhookRes = await fetch(CHATBOT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, userId, userChat, summary }),
      });

      if (webhookRes.ok) {
        const raw = await webhookRes.text();
        const trimmed = raw.trim();
        let parsed: unknown = trimmed;

        if (trimmed) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            parsed = trimmed;
          }
        }

        const normalized = normalizeWebhookPayload(parsed);
        output = normalized.output;
        audio = normalized.audio;
        alert = normalized.alert;
        confidenceScore = normalized.confidenceScore;
      }
    } catch {
      // Ignore webhook errors and fall back to local response.
    }

    if (!output) {
      output = getFallbackResponse(userChat);
    }

    let guardianCall: GuardianCallResult | undefined;
    if (alert) {
      guardianCall = await callGuardianForChatAlert({
        userId: authUser?.userId ?? null,
        fallbackUserName: resolvedUserName,
        confidenceScore,
      });

      if (guardianCall.called) {
        output = `${output}\n\nI have also reached out to your emergency caregiver so they can check on you right away.`;
      } else {
        output = `${output}\n\nPlease contact someone you trust right now. If you are in the United States, call or text 988 for immediate support.`;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        chatId,
        output,
        audio,
        alert,
        confidenceScore,
        guardianCall,
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

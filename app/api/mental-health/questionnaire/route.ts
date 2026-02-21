import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/rbac";

const MENTAL_HEALTH_WEBHOOK_URL =
  process.env.MENTAL_HEALTH_WEBHOOK_URL ??
  "https://synthomind.cloud/webhook/user-data-store";
const COMPLETION_COOKIE_NAME = "mhq_completed_user";

const QUESTION_TEXTS: Record<string, string> = {
  Q1: "How often do you find your mind thinking too much, even about small things?",
  Q2: "How often do you feel tense or unable to fully relax?",
  Q3: "How often does thinking too much make it hard for you to sleep?",
  Q4: "How often have you been feeling emotionally low recently?",
  Q5: "How often do you feel less interested in things you usually enjoy?",
  Q6: "How often do you feel tired or without motivation, even when you haven't done much?",
  Q7: "How often do upsetting memories from the past suddenly come to your mind?",
  Q8: "How often do you avoid certain people or situations because they remind you of something unpleasant?",
  Q9: "How often do you feel on edge or easily startled, even when things seem okay?",
  Q10: "How often do your moods change very quickly without a clear reason?",
  Q11: "How often do you feel unusually energetic or talkative in a way that feels different from your normal self?",
  Q12: "How often do your thoughts feel messy or hard to control?",
  Q13: "How often have you felt that life feels too difficult or overwhelming?",
  Q14: "How often do you feel completely stuck or hopeless about your situation?",
  Q15: "How often have you had thoughts about hurting yourself?",
};

const ANSWER_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Almost Always"];

/* ─── GET: Check if the user has completed the questionnaire ─────────── */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  const completedUserId = cookieStore.get(COMPLETION_COOKIE_NAME)?.value;
  const completed = completedUserId === user.userId;

  return NextResponse.json({
    ok: true,
    completed,
  });
}

/* ─── POST: Mark questionnaire completion + send webhook ─────────────── */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { answers } = body as {
      answers: { questionId: string; value: number }[];
    };

    if (!answers || !Array.isArray(answers) || answers.length !== 15) {
      return NextResponse.json(
        { ok: false, message: "All 15 questions must be answered." },
        { status: 400 }
      );
    }

    // Validate each answer
    for (const a of answers) {
      if (typeof a.value !== "number" || a.value < 0 || a.value > 4) {
        return NextResponse.json(
          { ok: false, message: `Invalid answer for ${a.questionId}` },
          { status: 400 }
        );
      }
    }

    const answerDetails = answers.map((a) => ({
      questionId: a.questionId,
      question: QUESTION_TEXTS[a.questionId] ?? a.questionId,
      answerValue: a.value,
      answerLabel: ANSWER_LABELS[a.value] ?? "Unknown",
    }));

    const webhookResponse = await fetch(MENTAL_HEALTH_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        completed: true,
        completedAt: new Date().toISOString(),
        answers: answerDetails,
      }),
      cache: "no-store",
    });

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { ok: false, message: "Failed to notify completion webhook." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Questionnaire completion saved successfully.",
      completed: true,
    });

    response.cookies.set(COMPLETION_COOKIE_NAME, user.userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err) {
    console.error("Mental health questionnaire save error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to save questionnaire completion." },
      { status: 500 }
    );
  }
}

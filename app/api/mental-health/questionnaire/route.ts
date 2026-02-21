import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import MentalHealthQuestionnaire from "@/lib/models/MentalHealthQuestionnaire";

const MENTAL_HEALTH_WEBHOOK_URL =
  process.env.MENTAL_HEALTH_WEBHOOK_URL ??
  "https://synthomind.cloud/webhook/user-data-store";

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
const QUESTION_IDS = Object.keys(QUESTION_TEXTS);
const QUESTION_ID_SET = new Set(QUESTION_IDS);

type QuestionnaireAnswer = {
  questionId: string;
  value: number;
};

type AnswerValidationResult =
  | { ok: true; answers: QuestionnaireAnswer[] }
  | { ok: false; message: string };

function validateAnswers(
  rawAnswers: unknown,
  requireAllQuestions: boolean
): AnswerValidationResult {
  if (!Array.isArray(rawAnswers)) {
    return { ok: false, message: "Answers must be an array." };
  }

  if (rawAnswers.length > QUESTION_IDS.length) {
    return { ok: false, message: "Too many answers submitted." };
  }

  const seen = new Set<string>();
  const answerMap = new Map<string, number>();

  for (const rawAnswer of rawAnswers) {
    if (!rawAnswer || typeof rawAnswer !== "object") {
      return { ok: false, message: "Invalid answer format." };
    }

    const entry = rawAnswer as { questionId?: unknown; value?: unknown };
    const questionId = entry.questionId;
    const value = entry.value;

    if (typeof questionId !== "string" || !QUESTION_ID_SET.has(questionId)) {
      return { ok: false, message: "Invalid question id in answers." };
    }

    if (seen.has(questionId)) {
      return { ok: false, message: `Duplicate answer for ${questionId}` };
    }

    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 4
    ) {
      return { ok: false, message: `Invalid answer for ${questionId}` };
    }

    seen.add(questionId);
    answerMap.set(questionId, value);
  }

  if (requireAllQuestions) {
    if (seen.size !== QUESTION_IDS.length) {
      return {
        ok: false,
        message: "All 15 questions must be answered.",
      };
    }

    for (const questionId of QUESTION_IDS) {
      if (!seen.has(questionId)) {
        return {
          ok: false,
          message: `Missing answer for ${questionId}`,
        };
      }
    }
  }

  const orderedAnswers = QUESTION_IDS.filter((questionId) =>
    answerMap.has(questionId)
  ).map((questionId) => ({
    questionId,
    value: answerMap.get(questionId) as number,
  }));

  return { ok: true, answers: orderedAnswers };
}

function computeScores(answers: QuestionnaireAnswer[]) {
  const values = new Map(answers.map((answer) => [answer.questionId, answer.value]));
  const sum = (ids: string[]) =>
    ids.reduce((total, id) => total + (values.get(id) ?? 0), 0);

  const anxiety = sum(["Q1", "Q2", "Q3"]);
  const depression = sum(["Q4", "Q5", "Q6"]);
  const trauma = sum(["Q7", "Q8", "Q9"]);
  const severeMood = sum(["Q10", "Q11", "Q12"]);
  const crisis = sum(["Q13", "Q14", "Q15"]);
  const total = anxiety + depression + trauma + severeMood + crisis;

  return {
    anxiety,
    depression,
    trauma,
    severeMood,
    crisis,
    total,
  };
}

// Force dynamic. Never cache this route.
export const dynamic = "force-dynamic";

// GET: Check completion and return saved draft answers
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  await dbConnect();

  const [dbUser, questionnaire] = await Promise.all([
    User.findOne({ userId: user.userId })
      .select("mentalHealthQuestionnaireCompleted")
      .lean(),
    MentalHealthQuestionnaire.findOne({ userId: user.userId })
      .select("answers description pdfFileName updatedAt")
      .lean(),
  ]);

  const completed = !!dbUser?.mentalHealthQuestionnaireCompleted;
  const answers = Array.isArray(questionnaire?.answers)
    ? questionnaire.answers
    : [];
  const description =
    typeof questionnaire?.description === "string"
      ? questionnaire.description
      : "";
  const pdfFileName =
    typeof questionnaire?.pdfFileName === "string"
      ? questionnaire.pdfFileName
      : "";

  return NextResponse.json(
    {
      ok: true,
      completed,
      answers,
      description,
      pdfFileName,
      updatedAt: questionnaire?.updatedAt ?? null,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

// PUT: Save questionnaire draft progress (partial answers allowed)
export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      answers?: unknown;
      description?: unknown;
      pdfFileName?: unknown;
    };

    let answersToSave: QuestionnaireAnswer[] | undefined;
    if (body.answers !== undefined) {
      const validatedAnswers = validateAnswers(body.answers, false);
      if (!validatedAnswers.ok) {
        return NextResponse.json(
          { ok: false, message: validatedAnswers.message },
          { status: 400 }
        );
      }
      answersToSave = validatedAnswers.answers;
    }

    const normalizedDescription =
      typeof body.description === "string" ? body.description.trim() : undefined;
    const normalizedPdfFileName =
      typeof body.pdfFileName === "string" ? body.pdfFileName.trim() : undefined;

    if (
      answersToSave === undefined &&
      normalizedDescription === undefined &&
      normalizedPdfFileName === undefined
    ) {
      return NextResponse.json(
        { ok: false, message: "Nothing to save." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      userId: user.userId,
    };

    if (answersToSave !== undefined) {
      updatePayload.answers = answersToSave;
      updatePayload.scores = computeScores(answersToSave);
    }
    if (normalizedDescription !== undefined) {
      updatePayload.description = normalizedDescription;
    }
    if (normalizedPdfFileName !== undefined) {
      updatePayload.pdfFileName = normalizedPdfFileName;
    }

    await dbConnect();
    await MentalHealthQuestionnaire.updateOne(
      { userId: user.userId },
      { $set: updatePayload },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      message: "Questionnaire draft saved.",
    });
  } catch (err) {
    console.error("Mental health questionnaire draft save error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to save questionnaire draft." },
      { status: 500 }
    );
  }
}

// POST: Final submission (all 15 answers required)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      answers?: unknown;
      description?: unknown;
      pdfFileName?: unknown;
    };

    const validatedAnswers = validateAnswers(body.answers, true);
    if (!validatedAnswers.ok) {
      return NextResponse.json(
        { ok: false, message: validatedAnswers.message },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const pdfFileName =
      typeof body.pdfFileName === "string" ? body.pdfFileName.trim() : "";

    const answerDetails = validatedAnswers.answers.map((answer) => ({
      questionId: answer.questionId,
      question: QUESTION_TEXTS[answer.questionId] ?? answer.questionId,
      answerValue: answer.value,
      answerLabel: ANSWER_LABELS[answer.value] ?? "Unknown",
    }));

    const scores = computeScores(validatedAnswers.answers);

    // Persist final answers + completion flag before calling webhook.
    await dbConnect();
    await Promise.all([
      User.updateOne(
        { userId: user.userId },
        { $set: { mentalHealthQuestionnaireCompleted: true } }
      ),
      MentalHealthQuestionnaire.updateOne(
        { userId: user.userId },
        {
          $set: {
            userId: user.userId,
            answers: validatedAnswers.answers,
            description,
            pdfFileName,
            scores,
          },
        },
        { upsert: true }
      ),
    ]);

    // Fire webhook (best-effort). Completion should not fail if webhook fails.
    try {
      await fetch(MENTAL_HEALTH_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          completed: true,
          completedAt: new Date().toISOString(),
          answers: answerDetails,
          description,
          pdfFileName,
          scores,
        }),
        cache: "no-store",
      });
    } catch (webhookErr) {
      console.error("Webhook notification failed (non-blocking):", webhookErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Questionnaire completion saved successfully.",
      completed: true,
    });
  } catch (err) {
    console.error("Mental health questionnaire save error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to save questionnaire completion." },
      { status: 500 }
    );
  }
}

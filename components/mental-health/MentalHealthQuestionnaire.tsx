"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type Question = {
  id: string;
  group: string;
  groupColor: string;
  text: string;
};

type SavedAnswer = {
  questionId: string;
  value: number;
};

const ANSWER_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Almost Always", value: 4 },
] as const;

const QUESTIONS: Question[] = [
  { id: "Q1", group: "Anxiety", groupColor: "text-blue-600", text: "How often do you find your mind thinking too much, even about small things?" },
  { id: "Q2", group: "Anxiety", groupColor: "text-blue-600", text: "How often do you feel tense or unable to fully relax?" },
  { id: "Q3", group: "Anxiety", groupColor: "text-blue-600", text: "How often does thinking too much make it hard for you to sleep?" },
  { id: "Q4", group: "Depression", groupColor: "text-indigo-600", text: "How often have you been feeling emotionally low recently?" },
  { id: "Q5", group: "Depression", groupColor: "text-indigo-600", text: "How often do you feel less interested in things you usually enjoy?" },
  { id: "Q6", group: "Depression", groupColor: "text-indigo-600", text: "How often do you feel tired or without motivation, even when you haven't done much?" },
  { id: "Q7", group: "Trauma / Stress", groupColor: "text-amber-600", text: "How often do upsetting memories from the past suddenly come to your mind?" },
  { id: "Q8", group: "Trauma / Stress", groupColor: "text-amber-600", text: "How often do you avoid certain people or situations because they remind you of something unpleasant?" },
  { id: "Q9", group: "Trauma / Stress", groupColor: "text-amber-600", text: "How often do you feel on edge or easily startled, even when things seem okay?" },
  { id: "Q10", group: "Severe Mood", groupColor: "text-purple-600", text: "How often do your moods change very quickly without a clear reason?" },
  { id: "Q11", group: "Severe Mood", groupColor: "text-purple-600", text: "How often do you feel unusually energetic or talkative in a way that feels different from your normal self?" },
  { id: "Q12", group: "Severe Mood", groupColor: "text-purple-600", text: "How often do your thoughts feel messy or hard to control?" },
  { id: "Q13", group: "Crisis / Safety", groupColor: "text-red-600", text: "How often have you felt that life feels too difficult or overwhelming?" },
  { id: "Q14", group: "Crisis / Safety", groupColor: "text-red-600", text: "How often do you feel completely stuck or hopeless about your situation?" },
  { id: "Q15", group: "Crisis / Safety", groupColor: "text-red-600", text: "How often have you had thoughts about hurting yourself?" },
];

const QUESTION_ID_SET = new Set(QUESTIONS.map((q) => q.id));

const GROUP_RANGES: { label: string; startIdx: number; endIdx: number; color: string }[] = [
  { label: "Anxiety", startIdx: 0, endIdx: 2, color: "bg-blue-500" },
  { label: "Depression", startIdx: 3, endIdx: 5, color: "bg-indigo-500" },
  { label: "Trauma / Stress", startIdx: 6, endIdx: 8, color: "bg-amber-500" },
  { label: "Severe Mood", startIdx: 9, endIdx: 11, color: "bg-purple-500" },
  { label: "Crisis / Safety", startIdx: 12, endIdx: 14, color: "bg-red-500" },
];

type Props = {
  onComplete: () => void;
};

export default function MentalHealthQuestionnaire({ onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savedPdfFileName, setSavedPdfFileName] = useState("");
  const [loadingSavedDraft, setLoadingSavedDraft] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxQuestionIndex = QUESTIONS.length - 1;
  const safeCurrentIdx = Math.min(Math.max(currentIdx, 0), maxQuestionIndex);
  const current = QUESTIONS[safeCurrentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const allAnswered = answeredCount === QUESTIONS.length;
  const currentPdfFileName = pdfFile?.name ?? savedPdfFileName;

  useEffect(() => {
    let cancelled = false;

    async function loadSavedDraft() {
      try {
        const res = await fetch("/api/mental-health/questionnaire", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) return;

        const data = (await res.json()) as {
          ok?: boolean;
          answers?: SavedAnswer[];
          description?: string;
          pdfFileName?: string;
        };

        if (!data.ok || cancelled) return;

        const nextAnswers: Record<string, number> = {};
        const rawAnswers = Array.isArray(data.answers) ? data.answers : [];

        for (const answer of rawAnswers) {
          if (
            answer &&
            typeof answer.questionId === "string" &&
            QUESTION_ID_SET.has(answer.questionId) &&
            typeof answer.value === "number" &&
            Number.isInteger(answer.value) &&
            answer.value >= 0 &&
            answer.value <= 4
          ) {
            nextAnswers[answer.questionId] = answer.value;
          }
        }

        if (Object.keys(nextAnswers).length > 0) {
          setAnswers(nextAnswers);
          const firstUnansweredIdx = QUESTIONS.findIndex(
            (q) => nextAnswers[q.id] === undefined
          );

          if (firstUnansweredIdx === -1) {
            setCurrentIdx(maxQuestionIndex);
            setShowExtras(true);
          } else {
            setCurrentIdx(firstUnansweredIdx);
          }
        }

        if (typeof data.description === "string") {
          setDescription(data.description);
        }

        if (typeof data.pdfFileName === "string") {
          setSavedPdfFileName(data.pdfFileName);
        }
      } catch {
        // Non-blocking. User can still fill from scratch if fetch fails.
      } finally {
        if (!cancelled) {
          setLoadingSavedDraft(false);
        }
      }
    }

    void loadSavedDraft();

    return () => {
      cancelled = true;
    };
  }, [maxQuestionIndex]);

  const draftAnswers = useMemo(
    () =>
      QUESTIONS.filter((q) => answers[q.id] !== undefined).map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? 0,
      })),
    [answers]
  );

  useEffect(() => {
    if (loadingSavedDraft || submitting) return;

    const normalizedDescription = description.trim();
    const shouldSaveDraft =
      draftAnswers.length > 0 ||
      normalizedDescription.length > 0 ||
      currentPdfFileName.length > 0;

    if (!shouldSaveDraft) return;

    const timer = setTimeout(() => {
      void fetch("/api/mental-health/questionnaire", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: draftAnswers,
          description: normalizedDescription,
          pdfFileName: currentPdfFileName,
        }),
      }).catch(() => {
        // Draft save failure should not block UI.
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [
    loadingSavedDraft,
    submitting,
    draftAnswers,
    description,
    currentPdfFileName,
  ]);

  function selectAnswer(value: number) {
    const willAnswerCurrentForFirstTime = answers[current.id] === undefined;
    const nextAnsweredCount =
      answeredCount + (willAnswerCurrentForFirstTime ? 1 : 0);

    setAnswers((prev) => ({ ...prev, [current.id]: value }));

    if (safeCurrentIdx < QUESTIONS.length - 1) {
      setTimeout(
        () => setCurrentIdx((idx) => Math.min(maxQuestionIndex, idx + 1)),
        300
      );
    } else if (nextAnsweredCount === QUESTIONS.length) {
      setTimeout(() => setShowExtras(true), 300);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setSavedPdfFileName("");
    }
  }

  async function handleSubmit() {
    if (!allAnswered) {
      setError("Please answer all 15 questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        answers: QUESTIONS.map((q) => ({
          questionId: q.id,
          value: answers[q.id] ?? 0,
        })),
        description: description.trim(),
        pdfFileName: currentPdfFileName,
      };

      const res = await fetch("/api/mental-health/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Failed to save. Please try again.");
        return;
      }

      onComplete();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentGroup = GROUP_RANGES.find(
    (group) => safeCurrentIdx >= group.startIdx && safeCurrentIdx <= group.endIdx
  );

  if (loadingSavedDraft) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#64748B]">Loading your saved answers...</p>
        </div>
      </div>
    );
  }

  if (showExtras) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Almost Done!</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Optionally add more context to help us understand you better.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-[#0F172A]">
            Anything else you&apos;d like to share?
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe how you've been feeling, any recent events, or anything relevant..."
            rows={4}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition"
          />
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-[#0F172A]">Upload a Report (PDF)</h2>
          <p className="text-xs text-[#94A3B8]">
            If you have a medical or psychological report, upload it here.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {currentPdfFileName ? (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium truncate">
                {currentPdfFileName}
              </span>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setSavedPdfFileName("");
                }}
                className="ml-auto text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-4 text-sm text-[#64748B] hover:border-primary hover:text-primary transition w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              Click to upload PDF
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowExtras(false)}
            className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Questions
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#0F4D2A] transition shadow-sm disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
          <Brain className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Mental Health Assessment
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Answer honestly - your responses are private and help us personalise
          your care.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Question {safeCurrentIdx + 1} of {QUESTIONS.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1">
          {GROUP_RANGES.map((group) => {
            const groupAnswered = QUESTIONS.slice(
              group.startIdx,
              group.endIdx + 1
            ).every((q) => answers[q.id] !== undefined);

            return (
              <button
                key={group.label}
                onClick={() =>
                  setCurrentIdx(Math.min(maxQuestionIndex, Math.max(0, group.startIdx)))
                }
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  currentGroup?.label === group.label
                    ? group.color
                    : groupAnswered
                    ? "bg-green-300"
                    : "bg-[#E2E8F0]"
                }`}
                title={group.label}
              />
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-6 space-y-5">
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${current.groupColor}`}
          >
            {current.group}
          </span>
          <h2 className="text-lg font-semibold text-[#0F172A] mt-1 leading-snug">
            {current.text}
          </h2>
        </div>

        <div className="space-y-2">
          {ANSWER_OPTIONS.map((opt) => {
            const isSelected = answers[current.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectAnswer(opt.value)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-[#E2E8F0] text-[#475569] hover:border-primary/40 hover:bg-[#F8FAFC]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-[#CBD5E1] text-[#94A3B8]"
                  }`}
                >
                  {String.fromCharCode(65 + opt.value)}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((idx) => Math.max(0, idx - 1))}
          disabled={safeCurrentIdx === 0}
          className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {safeCurrentIdx < QUESTIONS.length - 1 ? (
          <button
            onClick={() =>
              setCurrentIdx((idx) => Math.min(maxQuestionIndex, idx + 1))
            }
            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4D2A] transition shadow-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              if (allAnswered) setShowExtras(true);
            }}
            disabled={!allAnswered}
            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4D2A] transition shadow-sm disabled:opacity-50"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap">
        {QUESTIONS.map((question, index) => (
          <button
            key={question.id}
            onClick={() => setCurrentIdx(Math.min(maxQuestionIndex, Math.max(0, index)))}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              index === safeCurrentIdx
                ? "bg-primary scale-125"
                : answers[question.id] !== undefined
                ? "bg-green-400"
                : "bg-[#CBD5E1]"
            }`}
            title={`Q${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

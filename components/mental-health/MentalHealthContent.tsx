"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Smile,
  Meh,
  Frown,
  Sun,
  Moon,
  Wind,
  Heart,
  TrendingUp,
  Calendar,
  MessageCircle,
  Sparkles,
  Loader2,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import MentalHealthQuestionnaire from "./MentalHealthQuestionnaire";
import { useSession } from "@/hooks/useSession";

type Mood = "great" | "good" | "okay" | "low" | "bad";

const RECOMMENDATION_KEYS = [
  "recommendations",
  "items",
  "data",
  "output",
  "result",
  "routineRecommendations",
  "routine_recommendations",
] as const;

function splitRecommendationText(value: string): string[] {
  const normalized = value.replace(/\r/g, "").trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const numbered = normalized
    .split(/(?:^|\s)(?=\d+\.\s+)/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (numbered.length > 1) return numbered;

  return [normalized];
}

function toRecommendationList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number" || typeof item === "boolean") return String(item);
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const text = obj.text ?? obj.title ?? obj.recommendation ?? obj.item;
          if (typeof text === "string") return text.trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return splitRecommendationText(value);
  }

  return [];
}

function parseRecommendations(payload: unknown): {
  recommendations: string[];
  raw: Record<string, unknown> | null;
} {
  const direct = toRecommendationList(payload);
  if (direct.length > 0) {
    return { recommendations: direct, raw: null };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { recommendations: [], raw: null };
  }

  const obj = payload as Record<string, unknown>;

  for (const key of RECOMMENDATION_KEYS) {
    const list = toRecommendationList(obj[key]);
    if (list.length > 0) {
      return { recommendations: list, raw: null };
    }
  }

  for (const key of RECOMMENDATION_KEYS) {
    const nested = obj[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;

    const nestedObj = nested as Record<string, unknown>;
    for (const nestedKey of RECOMMENDATION_KEYS) {
      const list = toRecommendationList(nestedObj[nestedKey]);
      if (list.length > 0) {
        return { recommendations: list, raw: null };
      }
    }
  }

  return { recommendations: [], raw: obj };
}

const moodOptions: { mood: Mood; icon: typeof Smile; label: string; color: string }[] = [
  { mood: "great", icon: Smile, label: "Great", color: "bg-green-50 text-green-600 border-green-200" },
  { mood: "good", icon: Smile, label: "Good", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { mood: "okay", icon: Meh, label: "Okay", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { mood: "low", icon: Frown, label: "Low", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { mood: "bad", icon: Frown, label: "Bad", color: "bg-red-50 text-red-500 border-red-200" },
];

const weeklyLog = [
  { day: "Mon", mood: "good" as Mood },
  { day: "Tue", mood: "great" as Mood },
  { day: "Wed", mood: "okay" as Mood },
  { day: "Thu", mood: "low" as Mood },
  { day: "Fri", mood: "good" as Mood },
  { day: "Sat", mood: "great" as Mood },
  { day: "Sun", mood: "okay" as Mood },
];

const moodBarHeight: Record<Mood, string> = {
  great: "h-20",
  good: "h-16",
  okay: "h-12",
  low: "h-8",
  bad: "h-5",
};

const moodBarColor: Record<Mood, string> = {
  great: "bg-green-400",
  good: "bg-emerald-400",
  okay: "bg-amber-400",
  low: "bg-orange-400",
  bad: "bg-red-400",
};

const wellnessTips = [
  { icon: Sun, title: "Morning Sunlight", desc: "Get 10 min of sunlight within 1 hour of waking." },
  { icon: Wind, title: "Deep Breathing", desc: "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s." },
  { icon: Moon, title: "Sleep Hygiene", desc: "Avoid screens 1 hour before bed for better sleep." },
  { icon: Heart, title: "Gratitude Journal", desc: "Write 3 things you're grateful for each night." },
];

export default function MentalHealthContent() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [checkingQuestionnaire, setCheckingQuestionnaire] = useState(true);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [recomRaw, setRecomRaw] = useState<Record<string, unknown> | null>(null);
  const [recomError, setRecomError] = useState<string | null>(null);
  const [loadingRecom, setLoadingRecom] = useState(false);
  const { user } = useSession();

  const checkQuestionnaire = useCallback(async () => {
    try {
      const res = await fetch("/api/mental-health/questionnaire", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      setQuestionnaireCompleted(!!data.completed);
    } catch {
      // If fetch fails, assume not completed to be safe
      setQuestionnaireCompleted(false);
    } finally {
      setCheckingQuestionnaire(false);
    }
  }, []);

  useEffect(() => {
    checkQuestionnaire();
  }, [checkQuestionnaire]);

  const fetchRecommendations = useCallback(async () => {
    if (!user?.userId) return;
    setLoadingRecom(true);
    setRecomError(null);
    try {
      const res = await fetch("/api/mental-health/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid: user.userId, userId: user.userId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: unknown;
        recommendations?: unknown;
        raw?: unknown;
      };

      if (!res.ok || !data.ok) {
        const message =
          typeof data.message === "string"
            ? data.message
            : "Failed to fetch recommendations.";
        setRecommendations(null);
        setRecomRaw(null);
        setRecomError(message);
        return;
      }

      const parsed = parseRecommendations(data.recommendations ?? data.raw ?? null);
      if (parsed.recommendations.length > 0) {
        setRecommendations(parsed.recommendations);
        setRecomRaw(null);
        return;
      }

      setRecommendations(null);
      setRecomRaw(parsed.raw);
    } catch {
      setRecommendations(null);
      setRecomRaw(null);
      setRecomError("Failed to fetch recommendations.");
    } finally {
      setLoadingRecom(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (questionnaireCompleted) {
      fetchRecommendations();
    }
  }, [questionnaireCompleted, fetchRecommendations]);

  // Loading state while checking
  if (checkingQuestionnaire) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#64748B]">Loading…</p>
        </div>
      </div>
    );
  }

  // First-time user → show questionnaire
  if (!questionnaireCompleted) {
    return (
      <MentalHealthQuestionnaire
        onComplete={() => setQuestionnaireCompleted(true)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Mental Health
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track your mood, manage stress, and build healthy habits.
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4D2A] transition shadow-sm"
        >
          <MessageCircle className="h-4 w-4" />
          Talk to AI
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="w-full lg:w-3/5 flex flex-col gap-6">
          {/* Daily Mood Check-in */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-1">How are you feeling today?</h2>
            <p className="text-xs text-[#94A3B8] mb-4">Tap to log your mood</p>
            <div className="flex gap-3 justify-between">
              {moodOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedMood === opt.mood;
                return (
                  <button
                    key={opt.mood}
                    onClick={() => setSelectedMood(opt.mood)}
                    className={`flex-1 flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                      isSelected
                        ? `${opt.color} border-2 scale-105 shadow-sm`
                        : "border-[#E2E8F0] text-[#94A3B8] hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedMood && (
              <div className="mt-4 rounded-xl bg-soft-mint/30 border border-primary/10 p-3 text-center">
                <p className="text-sm text-primary font-medium">
                  Mood logged as &ldquo;{selectedMood}&rdquo; — stay mindful! 🧘
                </p>
              </div>
            )}
          </div>

          {/* Weekly Mood Chart */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0F172A]">Weekly Mood Trend</h2>
              <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                <Calendar className="h-3.5 w-3.5" />
                This week
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-28">
              {weeklyLog.map((entry) => (
                <div key={entry.day} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full max-w-[32px] rounded-t-lg ${moodBarHeight[entry.mood]} ${moodBarColor[entry.mood]} transition-all`}
                  />
                  <span className="text-[10px] font-medium text-[#94A3B8]">{entry.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stress Score */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-4">Stress Level</h2>
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="14"
                    fill="none" stroke="#E2E8F0" strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" r="14"
                    fill="none" stroke="#106534" strokeWidth="3"
                    strokeDasharray="88" strokeDashoffset="26"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#0F172A]">3.2</span>
                  <span className="text-[10px] text-[#94A3B8]">/ 10</span>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-600 px-2.5 py-1 text-xs font-semibold mb-2">
                  <TrendingUp className="h-3 w-3" /> Low Stress
                </span>
                <p className="text-sm text-[#64748B]">
                  Your stress levels have been well managed this week. Keep up the
                  healthy habits!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">
          {/* AI Insight */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-soft-mint/40 to-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-[#0F172A]">AI Insight</h3>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Based on your mood pattern this week, you tend to feel lower on
              Thursdays. Consider scheduling a short walk or meditation session
              mid-week to maintain balance.
            </p>
          </div>

          {/* Wellness Tips */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="border-b border-[#E2E8F0] px-5 py-4">
              <h3 className="font-semibold text-[#0F172A]">Daily Wellness Tips</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {wellnessTips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <div key={tip.title} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{tip.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Routine Recommendations */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-blue-50/40 to-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-[#0F172A]">Your Routine Recommendations</h3>
              </div>
              <button
                onClick={fetchRecommendations}
                disabled={loadingRecom}
                className="text-[#94A3B8] hover:text-primary transition"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRecom ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loadingRecom ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-[#64748B]">Fetching recommendations…</span>
              </div>
            ) : recomError ? (
              <p className="text-sm text-red-600 py-4 text-center">{recomError}</p>
            ) : recommendations && recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] px-4 py-3 text-sm text-[#475569]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : recomRaw ? (
              <pre className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#475569] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(recomRaw, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-[#94A3B8] py-4 text-center">
                No recommendations yet. Click refresh to check.
              </p>
            )}
          </div>

          {/* Quick Resources */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
            <h3 className="font-semibold text-[#0F172A] mb-3">Quick Resources</h3>
            <div className="space-y-2">
              {[
                { label: "Breathing Exercise", href: "#" },
                { label: "Guided Meditation", href: "#" },
                { label: "Sleep Stories", href: "#" },
                { label: "Crisis Helpline", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] px-4 py-2.5 text-sm text-[#64748B] hover:border-primary/30 hover:text-primary transition"
                >
                  {link.label}
                  <span className="text-[#CBD5E1]">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

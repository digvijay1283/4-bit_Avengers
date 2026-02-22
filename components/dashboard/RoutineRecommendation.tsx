"use client";

import { useState, useEffect } from "react";
import { Sun, CloudSun, Moon, Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface DayRoutine {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

type Period = "morning" | "afternoon" | "evening";

const PERIODS: { key: Period; label: string; icon: React.ReactNode; gradient: string; dot: string; time: string }[] =
  [
    {
      key: "morning",
      label: "Morning",
      icon: <Sun className="h-4 w-4" />,
      gradient: "from-amber-400 to-orange-400",
      dot: "bg-amber-400",
      time: "Dawn – Noon",
    },
    {
      key: "afternoon",
      label: "Afternoon",
      icon: <CloudSun className="h-4 w-4" />,
      gradient: "from-sky-400 to-blue-500",
      dot: "bg-sky-400",
      time: "Noon – 5 PM",
    },
    {
      key: "evening",
      label: "Evening",
      icon: <Moon className="h-4 w-4" />,
      gradient: "from-violet-500 to-purple-600",
      dot: "bg-violet-500",
      time: "5 PM – Bedtime",
    },
  ];

export default function RoutineRecommendation() {
  const [routine, setRoutine] = useState<DayRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Period>("morning");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutine = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/routine-recommendation");
      const data = await res.json();
      if (data.ok && data.routine) {
        setRoutine(data.routine);
        // Auto-select the period that matches current time
        const h = new Date().getHours();
        if (h < 12) setActive("morning");
        else if (h < 17) setActive("afternoon");
        else setActive("evening");
      } else {
        setError(data.message ?? "Could not load routine.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePeriod = PERIODS.find((p) => p.key === active)!;
  const items: string[] = routine?.[active] ?? [];

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary to-green-700 px-6 pt-6 pb-10">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-2 right-16 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                AI Daily Routine
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                Personalised from your health history
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchRoutine(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
            title="Refresh routine"
          >
            <RefreshCw
              className={`h-4 w-4 text-white ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Period tab pills — overlapping the header */}
      <div className="px-6 -mt-5 mb-5 flex gap-2 relative z-10">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all shadow-sm border ${
              active === p.key
                ? "bg-white text-slate-900 border-gray-200 shadow-md scale-105"
                : "bg-white/80 text-slate-500 border-gray-100 hover:bg-white"
            }`}
          >
            <span
              className={`mb-1 p-1.5 rounded-lg text-white bg-gradient-to-br ${p.gradient}`}
            >
              {p.icon}
            </span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        {/* Period header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${activePeriod.dot}`}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              {activePeriod.label} Schedule
            </span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-full">
            {activePeriod.time}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-slate-400">Building your routine…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={() => fetchRoutine()}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No {active} activities found.
          </p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, i) => {
              // Split "7:00 AM: Description" → time + description
              const colonIdx = item.indexOf(":");
              const secondColon = item.indexOf(":", colonIdx + 1);
              let time = "";
              let desc = item;
              if (secondColon > 0) {
                time = item.slice(0, secondColon).trim();
                desc = item.slice(secondColon + 1).trim();
              }

              return (
                <li
                  key={i}
                  className="flex gap-3 group"
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${activePeriod.gradient} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}
                    >
                      {i + 1}
                    </span>
                    {i < items.length - 1 && (
                      <div className="flex-1 w-px bg-gray-100 dark:bg-gray-700 mt-1" />
                    )}
                  </div>

                  <div className="pb-3 flex-1 min-w-0">
                    {time && (
                      <span
                        className={`text-xs font-bold bg-gradient-to-r ${activePeriod.gradient} bg-clip-text text-transparent`}
                      >
                        {time}
                      </span>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                      {desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

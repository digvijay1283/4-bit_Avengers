"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { Medicine } from "@/types/medicine";

/* ── Browser SpeechRecognition type shim ─────────────────────────────────── */
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionCtor(): (new () => ISpeechRecognition) | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

interface VoiceReminderSystemProps {
  medicines: Medicine[];
  audioEnabled: boolean;
  onDoseAction: (
    medicineId: string,
    action: "taken" | "snoozed" | "missed",
    scheduledTime: string
  ) => Promise<void>;
  onMissedStreak: (medicineId: string, count: number) => void;
}

// Snooze duration in minutes
const SNOOZE_MINUTES = 5;
const AUTO_SNOOZE_TIMEOUT_MS = 60_000;
const MISSED_ALERT_THRESHOLD = 2;

// Words that mean "taken"
const TAKEN_WORDS = [
  "taken",
  "done",
  "okay",
  "ok",
  "yes",
  "sure",
  "got it",
  "took it",
  "i took it",
  "completed",
  "finished",
  "take",
  "swallowed",
];

// Words that mean "snooze / later"
const SNOOZE_WORDS = [
  "later",
  "snooze",
  "remind me later",
  "not now",
  "wait",
  "hold on",
  "skip",
  "in a bit",
  "after",
  "few minutes",
  "5 minutes",
  "remind",
  "postpone",
];

// Track which medicine+time combos we already alerted for
type AlertKey = string;

export default function VoiceReminderSystem({
  medicines,
  audioEnabled,
  onDoseAction,
  onMissedStreak,
}: VoiceReminderSystemProps) {
  const alertedRef = useRef<Set<AlertKey>>(new Set());
  const snoozedRef = useRef<Map<AlertKey, number>>(new Map()); // key → snooze-until timestamp
  const listeningForRef = useRef<{
    medicineId: string;
    medicineName: string;
    scheduledTime: string;
    key: AlertKey;
  } | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSnoozeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentAlert, setCurrentAlert] = useState<{
    medicineId: string;
    medicineName: string;
    scheduledTime: string;
    key: AlertKey;
  } | null>(null);

  // ─── TTS speak ──────────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioEnabled || typeof window === "undefined") {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, [audioEnabled]);

  // ─── STT listen for response ────────────────────────────────
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = getSpeechRecognitionCtor();
    if (!SR) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const transcript = results
        .map((r) => r[0].transcript)
        .join(" ")
        .toLowerCase()
        .trim();

      console.log("[VoiceReminder] Heard:", transcript);

      const info = listeningForRef.current;
      if (!info) return;

      const isTaken = TAKEN_WORDS.some((w) => transcript.includes(w));
      const isSnoozed = SNOOZE_WORDS.some((w) => transcript.includes(w));

      if (isTaken) {
        if (autoSnoozeTimeoutRef.current) {
          clearTimeout(autoSnoozeTimeoutRef.current);
          autoSnoozeTimeoutRef.current = null;
        }
        onDoseAction(info.medicineId, "taken", info.scheduledTime);
        speak(`Great! ${info.medicineName} marked as taken.`);
        toast.success(`${info.medicineName} taken!`, {
          icon: "💊",
        });
        setCurrentAlert(null);
        listeningForRef.current = null;
      } else if (isSnoozed) {
        if (autoSnoozeTimeoutRef.current) {
          clearTimeout(autoSnoozeTimeoutRef.current);
          autoSnoozeTimeoutRef.current = null;
        }
        // Set snooze: remind again in SNOOZE_MINUTES
        const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60 * 1000;
        snoozedRef.current.set(info.key, snoozeUntil);
        alertedRef.current.delete(info.key); // allow re-alert after snooze
        onDoseAction(info.medicineId, "snoozed", info.scheduledTime);
        speak(
          `Okay, I'll remind you about ${info.medicineName} in ${SNOOZE_MINUTES} minutes.`
        );
        toast(`Snoozed ${info.medicineName} for ${SNOOZE_MINUTES} min`, {
          icon: "⏰",
        });
        setCurrentAlert(null);
        listeningForRef.current = null;
      } else {
        // Didn't understand — try again
        speak("Sorry, I didn't get that. Say taken or remind me later.");
        setTimeout(() => startListening(), 2000);
      }
    };

    recognition.onerror = (event) => {
      console.log("[VoiceReminder] STT error:", event.error);
      // On error, don't re-listen (user might have ignored)
    };

    recognition.onend = () => {
      // If we're still listening and didn't get a result, try once more after a pause
      if (listeningForRef.current) {
        setTimeout(() => {
          if (listeningForRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 1500);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, [onDoseAction, speak]);

  // ─── Core tick: check if any medicine is due ────────────────
  const checkReminders = useCallback(() => {
    if (!audioEnabled) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayKey = now.toISOString().slice(0, 10);

    for (const med of medicines) {
      // Skip already-done medicines
      if (med.status === "taken") continue;

      for (const time of med.times) {
        const [h, m] = time.split(":").map(Number);
        const timeMinutes = h * 60 + m;
        const key: AlertKey = `${todayKey}-${med._id}-${time}`;

        // Already alerted
        if (alertedRef.current.has(key)) continue;

        // Check snooze
        const snoozeUntil = snoozedRef.current.get(key);
        if (snoozeUntil && Date.now() < snoozeUntil) continue;
        // Clear expired snooze
        if (snoozeUntil && Date.now() >= snoozeUntil) {
          snoozedRef.current.delete(key);
        }

        // Is it time? (within a 2-minute window)
        if (
          currentMinutes >= timeMinutes &&
          currentMinutes <= timeMinutes + 2
        ) {
          alertedRef.current.add(key);

          const alertInfo = {
            medicineId: med._id,
            medicineName: med.name,
            scheduledTime: time,
            key,
          };

          setCurrentAlert(alertInfo);
          listeningForRef.current = alertInfo;

          if (autoSnoozeTimeoutRef.current) {
            clearTimeout(autoSnoozeTimeoutRef.current);
          }
          autoSnoozeTimeoutRef.current = setTimeout(() => {
            const active = listeningForRef.current;
            if (!active || active.key !== key) return;

            const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60 * 1000;
            snoozedRef.current.set(active.key, snoozeUntil);
            alertedRef.current.delete(active.key);
            onDoseAction(active.medicineId, "snoozed", active.scheduledTime);
            toast(`No response. Snoozed ${active.medicineName} for ${SNOOZE_MINUTES} min`, {
              icon: "⏰",
            });
            speak(
              `No response detected. I will remind you about ${active.medicineName} again in ${SNOOZE_MINUTES} minutes.`
            );

            if (recognitionRef.current) {
              try {
                recognitionRef.current.abort();
              } catch {}
            }

            listeningForRef.current = null;
            setCurrentAlert(null);
            autoSnoozeTimeoutRef.current = null;
          }, AUTO_SNOOZE_TIMEOUT_MS);

          // Speak the reminder
          speak(
            `It's time to take your ${med.name}, ${med.dosage}. Say taken when done, or say later to snooze.`
          ).then(() => {
            // After speaking, start listening
            startListening();
          });

          // Only alert one at a time
          return;
        }

        // Passed by 30+ minutes without any action? Mark as missed
        if (currentMinutes > timeMinutes + 30) {
          alertedRef.current.add(key);
          onDoseAction(med._id, "missed", time);
          if (med.missedStreakCount + 1 >= MISSED_ALERT_THRESHOLD) {
            onMissedStreak(med._id, med.missedStreakCount + 1);
          }
        }
      }
    }
  }, [medicines, audioEnabled, speak, startListening, onDoseAction, onMissedStreak]);

  // ─── Interval ───────────────────────────────────────────────
  useEffect(() => {
    // Check every 15 seconds
    checkReminders();
    intervalRef.current = setInterval(checkReminders, 15_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoSnoozeTimeoutRef.current) {
        clearTimeout(autoSnoozeTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      window.speechSynthesis.cancel();
    };
  }, [checkReminders]);

  // ─── On-screen alert (non-voice fallback + visual) ─────────
  const handleTakenClick = () => {
    if (!currentAlert) return;
    if (autoSnoozeTimeoutRef.current) {
      clearTimeout(autoSnoozeTimeoutRef.current);
      autoSnoozeTimeoutRef.current = null;
    }
    onDoseAction(currentAlert.medicineId, "taken", currentAlert.scheduledTime);
    toast.success(`${currentAlert.medicineName} taken!`, { icon: "💊" });
    speak(`${currentAlert.medicineName} marked as taken.`);
    listeningForRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setCurrentAlert(null);
  };

  const handleSnoozeClick = () => {
    if (!currentAlert) return;
    if (autoSnoozeTimeoutRef.current) {
      clearTimeout(autoSnoozeTimeoutRef.current);
      autoSnoozeTimeoutRef.current = null;
    }
    const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60 * 1000;
    snoozedRef.current.set(currentAlert.key, snoozeUntil);
    alertedRef.current.delete(currentAlert.key);
    onDoseAction(
      currentAlert.medicineId,
      "snoozed",
      currentAlert.scheduledTime
    );
    toast(`Snoozed for ${SNOOZE_MINUTES} min`, { icon: "⏰" });
    listeningForRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setCurrentAlert(null);
  };

  if (!currentAlert) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-primary/20 p-6 max-w-md w-full animate-in slide-in-from-top fade-in duration-300">
        {/* Pulsing indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary">
                notifications_active
              </span>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Medicine Time!</h3>
            <p className="text-sm text-slate-500">
              {currentAlert.scheduledTime} reminder
            </p>
          </div>
        </div>

        <p className="text-slate-700 mb-1 font-semibold text-base">
          {currentAlert.medicineName}
        </p>
        <p className="text-slate-500 text-sm mb-5">
          Say <span className="font-bold text-primary">&quot;Taken&quot;</span>{" "}
          or{" "}
          <span className="font-bold text-amber-600">
            &quot;Remind me later&quot;
          </span>
        </p>

        {/* Listening indicator */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-blue-50 rounded-xl">
          <div className="flex gap-1">
            <span className="w-1.5 h-4 bg-blue-400 rounded-full animate-pulse" />
            <span
              className="w-1.5 h-5 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-3 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
            <span
              className="w-1.5 h-5 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: "450ms" }}
            />
          </div>
          <span className="text-xs font-semibold text-blue-600">
            Listening for your response...
          </span>
        </div>

        {/* Manual buttons (fallback) */}
        <div className="flex gap-3">
          <button
            onClick={handleTakenClick}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            ✓ Take Now
          </button>
          <button
            onClick={handleSnoozeClick}
            className="flex-1 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200"
          >
            ⏰ Snooze {SNOOZE_MINUTES}m
          </button>
        </div>
      </div>
    </div>
  );
}

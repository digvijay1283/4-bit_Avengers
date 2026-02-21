"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { Medicine } from "@/types/medicine";

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
  onGuardianAlert: (
    medicineId: string,
    medicineName: string,
    missedCount: number
  ) => void;
}

const SNOOZE_MINUTES = 5;
const NO_RESPONSE_TIMEOUT_MS = 60_000;
const MISSED_ALERT_THRESHOLD = 2;

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

type AlertKey = string;

type ActiveAlert = {
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  key: AlertKey;
};

export default function VoiceReminderSystem({
  medicines,
  audioEnabled,
  onDoseAction,
  onMissedStreak,
  onGuardianAlert,
}: VoiceReminderSystemProps) {
  const alertedRef = useRef<Set<AlertKey>>(new Set());
  const snoozedRef = useRef<Map<AlertKey, number>>(new Map());
  const idleMissCountRef = useRef<Map<AlertKey, number>>(new Map());
  const listeningForRef = useRef<ActiveAlert | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [currentAlert, setCurrentAlert] = useState<ActiveAlert | null>(null);

  const speak = useCallback(
    (text: string): Promise<void> => {
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
    },
    [audioEnabled]
  );

  const speakAlarmIgnored = useCallback(
    (medicineName: string, missedCount: number): void => {
      if (!audioEnabled || typeof window === "undefined") return;

      window.speechSynthesis.cancel();
      const message =
        missedCount >= MISSED_ALERT_THRESHOLD
          ? `No response again for ${medicineName}. Triggering guardian alert now.`
          : `Alarm snoozed. ${medicineName} reminder has been snoozed for ${SNOOZE_MINUTES} minutes.`;

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.05;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [audioEnabled]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
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
        if (noResponseTimeoutRef.current) {
          clearTimeout(noResponseTimeoutRef.current);
          noResponseTimeoutRef.current = null;
          console.log(
            "[VoiceReminder] Inactivity timer cleared: user marked taken",
            info.key
          );
        }

        idleMissCountRef.current.delete(info.key);
        snoozedRef.current.delete(info.key);
        void onDoseAction(info.medicineId, "taken", info.scheduledTime);
        void speak(`Great! ${info.medicineName} marked as taken.`);
        toast.success(`${info.medicineName} taken!`);
        setCurrentAlert(null);
        listeningForRef.current = null;
        return;
      }

      if (isSnoozed) {
        if (noResponseTimeoutRef.current) {
          clearTimeout(noResponseTimeoutRef.current);
          noResponseTimeoutRef.current = null;
          console.log(
            "[VoiceReminder] Inactivity timer cleared: user requested snooze",
            info.key
          );
        }

        idleMissCountRef.current.delete(info.key);
        const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60 * 1000;
        snoozedRef.current.set(info.key, snoozeUntil);
        alertedRef.current.delete(info.key);
        void onDoseAction(info.medicineId, "snoozed", info.scheduledTime);

        console.log("[VoiceReminder] Snoozed by voice command", {
          key: info.key,
          medicineId: info.medicineId,
          scheduledTime: info.scheduledTime,
          snoozeUntil: new Date(snoozeUntil).toISOString(),
        });

        void speak(
          `Okay, I'll remind you about ${info.medicineName} in ${SNOOZE_MINUTES} minutes.`
        );
        toast(`Snoozed ${info.medicineName} for ${SNOOZE_MINUTES} min`);
        setCurrentAlert(null);
        listeningForRef.current = null;
        return;
      }

      void speak("Sorry, I did not get that. Say taken or remind me later.");
      setTimeout(() => startListening(), 2000);
    };

    recognition.onerror = (event) => {
      console.log("[VoiceReminder] STT error:", event.error);
    };

    recognition.onend = () => {
      if (!listeningForRef.current) return;

      setTimeout(() => {
        if (!listeningForRef.current) return;
        try {
          recognition.start();
        } catch {}
      }, 1500);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, [onDoseAction, speak]);

  const checkReminders = useCallback(() => {
    if (!audioEnabled) return;

    const now = new Date();
    const nowMs = Date.now();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayKey = now.toISOString().slice(0, 10);

    const setupNoResponseTimeout = (alertKey: AlertKey) => {
      if (noResponseTimeoutRef.current) {
        clearTimeout(noResponseTimeoutRef.current);
      }

      console.log("[VoiceReminder] Inactivity timer started", {
        key: alertKey,
        timeoutMs: NO_RESPONSE_TIMEOUT_MS,
      });

      noResponseTimeoutRef.current = setTimeout(() => {
        const active = listeningForRef.current;
        if (!active || active.key !== alertKey) {
          console.log(
            "[VoiceReminder] Inactivity timer ignored: active alert changed",
            {
              timerKey: alertKey,
              activeKey: active?.key,
            }
          );
          return;
        }

        const idleMisses = (idleMissCountRef.current.get(active.key) ?? 0) + 1;
        idleMissCountRef.current.set(active.key, idleMisses);

        console.log("[VoiceReminder] No-response timeout reached", {
          key: active.key,
          medicineId: active.medicineId,
          scheduledTime: active.scheduledTime,
          timeoutMs: NO_RESPONSE_TIMEOUT_MS,
          consecutiveIdleMisses: idleMisses,
        });

        if (idleMisses >= MISSED_ALERT_THRESHOLD) {
          void onDoseAction(active.medicineId, "missed", active.scheduledTime);
          snoozedRef.current.delete(active.key);
          idleMissCountRef.current.delete(active.key);
          onMissedStreak(active.medicineId, idleMisses);
          onGuardianAlert(active.medicineId, active.medicineName, idleMisses);
          toast.error(
            `No response twice for ${active.medicineName}. Triggering guardian alert.`,
            { duration: 6000 }
          );
        } else {
          void onDoseAction(active.medicineId, "snoozed", active.scheduledTime);
          const retryAt = Date.now() + SNOOZE_MINUTES * 60 * 1000;
          snoozedRef.current.set(active.key, retryAt);
          alertedRef.current.delete(active.key);
          toast(
            `No response in 1 minute. Alarm snoozed for ${SNOOZE_MINUTES} minutes.`,
            { duration: 5000 }
          );
        }

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }

        listeningForRef.current = null;
        setCurrentAlert(null);
        speakAlarmIgnored(active.medicineName, idleMisses);
        noResponseTimeoutRef.current = null;
      }, NO_RESPONSE_TIMEOUT_MS);
    };

    for (const med of medicines) {
      if (med.status === "taken" || med.status === "snoozed") continue;

      for (const time of med.times) {
        const [h, m] = time.split(":").map(Number);
        const timeMinutes = h * 60 + m;
        const key: AlertKey = `${todayKey}-${med._id}-${time}`;

        if (alertedRef.current.has(key)) continue;

        const retryDueAt = snoozedRef.current.get(key);
        const isRetryDue = typeof retryDueAt === "number" && nowMs >= retryDueAt;

        if (retryDueAt && !isRetryDue) continue;
        if (isRetryDue) {
          snoozedRef.current.delete(key);
        }

        const isScheduledWindow =
          currentMinutes >= timeMinutes && currentMinutes <= timeMinutes + 2;

        if (isScheduledWindow || isRetryDue) {
          alertedRef.current.add(key);

          const alertInfo: ActiveAlert = {
            medicineId: med._id,
            medicineName: med.name,
            scheduledTime: time,
            key,
          };

          setCurrentAlert(alertInfo);
          listeningForRef.current = alertInfo;
          setupNoResponseTimeout(key);

          void speak(
            `It's time to take your ${med.name}, ${med.dosage}. Say taken when done, or say later to snooze.`
          ).then(() => startListening());

          return;
        }

        if (currentMinutes > timeMinutes + 30) {
          alertedRef.current.add(key);
          idleMissCountRef.current.delete(key);
          void onDoseAction(med._id, "missed", time);

          if (med.missedStreakCount + 1 >= MISSED_ALERT_THRESHOLD) {
            onMissedStreak(med._id, med.missedStreakCount + 1);
          }
        }
      }
    }
  }, [
    medicines,
    audioEnabled,
    speak,
    startListening,
    onDoseAction,
    onMissedStreak,
    onGuardianAlert,
    speakAlarmIgnored,
  ]);

  useEffect(() => {
    checkReminders();
    intervalRef.current = setInterval(checkReminders, 15_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (noResponseTimeoutRef.current) {
        clearTimeout(noResponseTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, [checkReminders]);

  const handleTakenClick = () => {
    if (!currentAlert) return;

    if (noResponseTimeoutRef.current) {
      clearTimeout(noResponseTimeoutRef.current);
      noResponseTimeoutRef.current = null;
      console.log(
        "[VoiceReminder] Inactivity timer cleared: manual taken",
        currentAlert.key
      );
    }

    idleMissCountRef.current.delete(currentAlert.key);
    snoozedRef.current.delete(currentAlert.key);
    void onDoseAction(currentAlert.medicineId, "taken", currentAlert.scheduledTime);
    toast.success(`${currentAlert.medicineName} taken!`);
    void speak(`${currentAlert.medicineName} marked as taken.`);
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

    if (noResponseTimeoutRef.current) {
      clearTimeout(noResponseTimeoutRef.current);
      noResponseTimeoutRef.current = null;
      console.log(
        "[VoiceReminder] Inactivity timer cleared: manual snooze",
        currentAlert.key
      );
    }

    idleMissCountRef.current.delete(currentAlert.key);
    const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60 * 1000;
    snoozedRef.current.set(currentAlert.key, snoozeUntil);
    alertedRef.current.delete(currentAlert.key);

    void onDoseAction(currentAlert.medicineId, "snoozed", currentAlert.scheduledTime);

    console.log("[VoiceReminder] Snoozed by button", {
      key: currentAlert.key,
      medicineId: currentAlert.medicineId,
      scheduledTime: currentAlert.scheduledTime,
      snoozeUntil: new Date(snoozeUntil).toISOString(),
    });

    toast(`Snoozed for ${SNOOZE_MINUTES} min`);
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
            <p className="text-sm text-slate-500">{currentAlert.scheduledTime} reminder</p>
          </div>
        </div>

        <p className="text-slate-700 mb-1 font-semibold text-base">
          {currentAlert.medicineName}
        </p>
        <p className="text-slate-500 text-sm mb-5">
          Say <span className="font-bold text-primary">&quot;Taken&quot;</span> or{" "}
          <span className="font-bold text-amber-600">&quot;Remind me later&quot;</span>
        </p>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          No response for 1 minute will auto-snooze this reminder for {SNOOZE_MINUTES} minutes. Two consecutive no-response alarms trigger guardian alert.
        </p>

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

        <div className="flex gap-3">
          <button
            onClick={handleTakenClick}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Take Now
          </button>
          <button
            onClick={handleSnoozeClick}
            className="flex-1 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200"
          >
            Snooze {SNOOZE_MINUTES}m
          </button>
        </div>
      </div>
    </div>
  );
}

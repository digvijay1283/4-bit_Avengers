"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Mic, MicOff, Loader2, Volume2, Bot } from "lucide-react";
import { randomUUID } from "@/lib/uuid";
import { useDailySummary } from "@/hooks/useDailySummary";
import { useSession } from "@/hooks/useSession";

// Load Live2D viewer client-side only (pixi.js cannot run on server)
const Live2DViewer = dynamic(
  () => import("@/components/assistant/Live2DViewer"),
  { ssr: false }
);

/* ── Types ─────────────────────────────────────────────────────────────── */
type Phase = "idle" | "listening" | "processing" | "speaking";

interface ChatEntry {
  id: string;
  userText: string;
  replyText: string;
}

/* ── SpeechRecognition shim ─────────────────────────────────────────────── */
interface ISpeechRec extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRec;
    webkitSpeechRecognition?: new () => ISpeechRec;
  }
}

/* ── Strip markdown for TTS ─────────────────────────────────────────────── */
function stripMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .trim();
}

/* ── Phase label ─────────────────────────────────────────────────────────── */
const PHASE_LABEL: Record<Phase, string> = {
  idle: "Tap the mic and speak",
  listening: "Listening…",
  processing: "Thinking…",
  speaking: "Speaking…",
};

export default function AssistantPage() {
  const { user } = useSession();
  const userId = user?.userId ?? "guest";
  const { summary } = useDailySummary(userId || null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [chatId] = useState(() => randomUUID());

  const recRef = useRef<ISpeechRec | null>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef(""); // accumulated final transcript text

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Auto-scroll history
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  /* ── Stop all playback ──────────────────────────────────────────────── */
  const stopAudio = useCallback(() => {
    if (uttRef.current) { window.speechSynthesis.cancel(); uttRef.current = null; }
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
  }, []);

  /* ── Play reply (server audio or TTS fallback) ──────────────────────── */
  const playReply = useCallback((text: string, audioB64: string, onDone: () => void) => {
    setPhase("speaking");

    if (audioB64 && audioB64.trim()) {
      const src = audioB64.startsWith("data:") || audioB64.startsWith("http")
        ? audioB64
        : `data:audio/mp3;base64,${audioB64}`;
      const el = new Audio(src);
      audioElRef.current = el;
      el.onended = () => { audioElRef.current = null; onDone(); };
      el.onerror = () => { audioElRef.current = null; speakTTS(text, onDone); };
      el.play().catch(() => { audioElRef.current = null; speakTTS(text, onDone); });
      return;
    }
    speakTTS(text, onDone);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function speakTTS(text: string, onDone: () => void) {
    const utt = new SpeechSynthesisUtterance(stripMd(text));
    utt.rate = 1;
    utt.pitch = 1;
    utt.onend = () => { uttRef.current = null; onDone(); };
    utt.onerror = () => { uttRef.current = null; onDone(); };
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }

  /* ── Send captured text to API ──────────────────────────────────────── */
  const sendQuery = useCallback(
    async (text: string) => {
      if (!text.trim()) { setPhase("idle"); return; }

      setPhase("processing");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, userId, userChat: text, summary: summary ?? "" }),
        });
        const payload = (await res.json()) as {
          ok: boolean;
          output?: string;
          audio?: string;
          message?: string;
        };
        const replyText = payload.ok && payload.output
          ? payload.output
          : (payload.message ?? "Sorry, something went wrong.");
        const audioB64 = payload.audio ?? "";

        setHistory((prev) => [...prev, { id: randomUUID(), userText: text, replyText }]);

        playReply(replyText, audioB64, () => setPhase("idle"));
      } catch {
        setHistory((prev) => [
          ...prev,
          { id: randomUUID(), userText: text, replyText: "Network error. Please try again." },
        ]);
        setPhase("idle");
      }
    },
    [chatId, userId, summary, playReply]
  );

  /* ── Start voice recording ──────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (phaseRef.current !== "idle") return;

    // Unlock speechSynthesis while inside user gesture
    try {
      const u = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch { /* ignore */ }

    const SpeechRec =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    stopAudio();
    finalRef.current = "";
    setTranscript("");
    setPhase("listening");

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    function resetSilence() {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => rec.stop(), 2200);
    }

    rec.onresult = (e) => {
      resetSilence();
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim = t;
      }
      setTranscript((finalRef.current + interim).trim());
    };

    rec.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      recRef.current = null;
      const captured = finalRef.current.trim();
      if (captured) {
        sendQuery(captured);
      } else {
        setPhase("idle");
        setTranscript("");
      }
    };

    rec.onerror = (e) => {
      if (["aborted", "no-speech"].includes(e.error)) return;
      console.warn("SpeechRecognition error:", e.error);
      setPhase("idle");
    };

    rec.start();
    resetSilence();
  }, [stopAudio, sendQuery]);

  /* ── Stop listening early ──────────────────────────────────────────── */
  const stopListening = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop();
      recRef.current = null;
    }
  }, []);

  /* ── Cleanup on unmount ─────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      stopAudio();
      if (recRef.current) { recRef.current.abort(); recRef.current = null; }
    };
  }, [stopAudio]);

  const isSpeaking = phase === "speaking";

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden bg-gradient-to-br from-[#F0FDF4] via-[#F8FAFC] to-[#EFF6FF]">

      {/* ── Left panel: Chat history ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden border-r border-[#E2E8F0]">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 border-b border-[#E2E8F0] bg-white/80 backdrop-blur-sm px-5 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D1FAE5]">
            <Bot className="h-3.5 w-3.5 text-[#106534]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">AI Voice Assistant</p>
            <p className="text-xs text-[#64748B]">Speak naturally — Hiyori listens</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Live
          </div>
        </div>

        {/* Mobile: Live2D strip */}
        <div className="md:hidden shrink-0 h-52 bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] overflow-hidden relative">
          <Live2DViewer speaking={isSpeaking} className="w-full h-full" />
          {/* Mobile mic controls */}
          <div className="absolute bottom-3 inset-x-0 flex flex-col items-center gap-1">
            {transcript && (
              <p className="text-xs text-[#475569] italic truncate max-w-[80%] bg-white/70 rounded-full px-3 py-0.5">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                if (phase === "listening") stopListening();
                else if (phase === "idle") startListening();
              }}
              disabled={phase === "processing" || phase === "speaking"}
              aria-label={phase === "listening" ? "Stop" : "Start listening"}
              className={[
                "relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg active:scale-95 transition-all duration-200",
                phase === "idle"
                  ? "bg-[#106534] text-white"
                  : phase === "listening"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed",
              ].join(" ")}
            >
              {phase === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> : phase === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {phase === "listening" && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />}
            </button>
          </div>
        </div>

        {/* Conversation history */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 no-scrollbar">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-60">
              <Volume2 className="h-8 w-8 text-[#94A3B8]" />
              <p className="text-sm text-[#64748B]">Start talking to get a response</p>
            </div>
          )}
          {history.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-2">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-[#106534] text-white px-4 py-2.5 text-sm leading-relaxed">
                  {entry.userText}
                </div>
              </div>
              {/* Assistant bubble */}
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[#E2E8F0] bg-white text-[#1E293B] px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                  {entry.replyText}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Right panel: Live2D character + voice controls ────────────── */}
      <div className="relative hidden md:flex flex-col items-center justify-between w-[42%] bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] overflow-hidden">

        {/* Character name badge */}
        <div className="shrink-0 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-[#E2E8F0] shadow-sm mt-4">
          <Bot className="h-3.5 w-3.5 text-[#106534]" />
          <span className="text-xs font-semibold text-[#106534]">Hiyori · VitalAI</span>
        </div>

        {/* Live2D character — fills remaining space */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Glow ring */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(16,101,52,0.08) 0%, transparent 60%)",
              animation: isSpeaking ? "pulse 1s ease-in-out infinite" : "none",
            }}
          />
          <Live2DViewer speaking={isSpeaking} className="w-full h-full" />
        </div>

        {/* Voice controls */}
        <div className="shrink-0 w-full bg-white/80 backdrop-blur-sm border-t border-[#E2E8F0] px-6 py-5 flex flex-col items-center gap-3">
          {/* Live transcript */}
          {transcript ? (
            <p className="text-sm text-[#475569] italic text-center truncate max-w-full px-2">
              &ldquo;{transcript}&rdquo;
            </p>
          ) : (
            <p className="text-xs font-medium text-[#94A3B8]">{PHASE_LABEL[phase]}</p>
          )}

          {/* Phase pill */}
          <div className={[
            "flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1",
            phase === "listening" ? "bg-red-50 text-red-500" :
            phase === "processing" ? "bg-amber-50 text-amber-600" :
            phase === "speaking" ? "bg-blue-50 text-blue-600" :
            "bg-[#F1F5F9] text-[#94A3B8]",
          ].join(" ")}>
            <span className={[
              "h-1.5 w-1.5 rounded-full",
              phase === "listening" ? "bg-red-500 animate-pulse" :
              phase === "processing" ? "bg-amber-500 animate-pulse" :
              phase === "speaking" ? "bg-blue-500 animate-pulse" :
              "bg-[#CBD5E1]",
            ].join(" ")} />
            {PHASE_LABEL[phase]}
          </div>

          {/* Mic button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (phase === "listening") stopListening();
              else if (phase === "idle") startListening();
            }}
            disabled={phase === "processing" || phase === "speaking"}
            aria-label={phase === "listening" ? "Stop" : "Start listening"}
            className={[
              "relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 shadow-lg active:scale-95",
              phase === "idle"
                ? "bg-[#106534] text-white hover:bg-[#0e5229] shadow-[0_4px_24px_rgba(16,101,52,0.4)]"
                : phase === "listening"
                ? "bg-red-500 text-white shadow-[0_4px_24px_rgba(239,68,68,0.4)] animate-pulse"
                : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed",
            ].join(" ")}
          >
            {phase === "processing" ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : phase === "listening" ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
            {phase === "listening" && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

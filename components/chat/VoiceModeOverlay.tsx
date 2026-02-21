"use client";

import { useEffect, useRef, useState } from "react";
import { X, Mic } from "lucide-react";

/* ── Browser SpeechRecognition type shim ─────────────────────────────────── */
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
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
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

/* ── Phase of the voice loop ─────────────────────────────────────────────── */
type VoicePhase = "listening" | "processing" | "speaking" | "idle";

interface VoiceModeOverlayProps {
  onSendAndGetReply: (text: string) => Promise<string>;
  onClose: () => void;
}

/**
 * Full-screen voice conversation overlay.
 *
 * ALL mutable logic lives in refs so it is immune to React re-renders,
 * stale closures, and strict-mode double-mounting.  State is only used
 * for the four values that drive the UI.
 */
export default function VoiceModeOverlay({
  onSendAndGetReply,
  onClose,
}: VoiceModeOverlayProps) {
  /* ── UI state (render only) ──────────────────────────────────────────── */
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [displayWords, setDisplayWords] = useState<string[]>([]);

  /* ── Stable refs ─────────────────────────────────────────────────────── */
  const recRef = useRef<ISpeechRecognition | null>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const finalTextRef = useRef("");   // accumulated final transcript

  // Always-fresh callback refs — never stale, no dependency chains
  const onSendRef = useRef(onSendAndGetReply);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onSendRef.current = onSendAndGetReply; }, [onSendAndGetReply]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function clearWordTimer() {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function cancelTTS() {
    speechSynthesis.cancel();
    uttRef.current = null;
    clearWordTimer();
  }

  function stopRec() {
    clearSilenceTimer();
    if (recRef.current) {
      try { recRef.current.abort(); } catch { /* ignore */ }
      recRef.current = null;
    }
  }

  /* ── TTS: speak assistant reply ─────────────────────────────────────── */
  function speakReply(text: string) {
    if (closingRef.current) return;
    cancelTTS();
    setPhase("speaking");
    setTranscript("");
    setInterimText("");

    const words = text.split(/\s+/).filter(Boolean);
    setDisplayWords([]);

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1;
    utt.pitch = 1;
    utt.lang = "en-US";
    uttRef.current = utt;

    let wordIndex = 0;
    let boundaryFired = false;

    utt.onboundary = (e) => {
      if (e.name === "word" && wordIndex < words.length) {
        boundaryFired = true;
        clearWordTimer();
        wordIndex++;
        setDisplayWords(words.slice(0, wordIndex));
      }
    };

    // Timer fallback for browsers where onboundary doesn't fire
    const msPerWord = Math.max(80, 150 / utt.rate);
    wordTimerRef.current = setInterval(() => {
      if (boundaryFired) { clearWordTimer(); return; }
      if (wordIndex < words.length) {
        wordIndex++;
        setDisplayWords(words.slice(0, wordIndex));
      } else {
        clearWordTimer();
      }
    }, msPerWord);

    const afterSpeak = () => {
      setDisplayWords(words);
      uttRef.current = null;
      clearWordTimer();
      if (!closingRef.current) {
        setTimeout(() => { if (!closingRef.current) startListening(); }, 600);
      }
    };

    utt.onend = afterSpeak;
    utt.onerror = afterSpeak;

    speechSynthesis.speak(utt);
  }

  /* ── Send recognised text → get reply → TTS ─────────────────────────── */
  async function sendAndSpeak(text: string) {
    if (!text.trim() || closingRef.current) return;
    stopRec();                 // stop mic while processing + speaking
    setPhase("processing");
    setTranscript(text);
    setInterimText("");

    try {
      const reply = await onSendRef.current(text.trim());
      if (!closingRef.current) speakReply(reply);
    } catch {
      if (!closingRef.current) {
        speakReply("Sorry, I could not get a response. Let us try again.");
      }
    }
  }

  /* ── STT: start listening (continuous mode — ONE instance, no restarts) */
  function startListening() {
    if (closingRef.current) return;

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setPhase("idle"); return; }

    // Clean up anything leftover
    stopRec();
    cancelTTS();

    setPhase("listening");
    setTranscript("");
    setInterimText("");
    setDisplayWords([]);
    finalTextRef.current = "";

    const rec = new SR();
    rec.continuous = true;       // ← stay open, no restart loop
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let latestFinal = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          latestFinal += t;
        } else {
          interim += t;
        }
      }

      if (latestFinal) {
        finalTextRef.current = (
          finalTextRef.current
            ? `${finalTextRef.current} ${latestFinal}`
            : latestFinal
        ).trim();
        setTranscript(finalTextRef.current);
        setInterimText("");
      } else if (interim) {
        setInterimText(interim);
      }

      // Reset the silence timer every time we get speech
      clearSilenceTimer();

      // If we have final text, start a silence countdown.
      // After 1.8s of silence → auto-send.
      if (finalTextRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (closingRef.current) return;
          const text = finalTextRef.current;
          if (text.trim()) sendAndSpeak(text);
        }, 1800);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted") return;          // we aborted it ourselves
      if (e.error === "no-speech") return;         // silence — keep listening
      if (e.error === "network") return;           // transient — keep living
      // Fatal errors (not-allowed, service-not-allowed)
      recRef.current = null;
      clearSilenceTimer();
      if (!closingRef.current) setPhase("idle");
    };

    rec.onend = () => {
      recRef.current = null;
      clearSilenceTimer();
      if (closingRef.current) return;

      // If we had accumulated speech, send it now
      const pending = finalTextRef.current.trim();
      if (pending) {
        sendAndSpeak(pending);
      } else {
        // Browser killed recognition (timeout, etc.) — single restart
        setTimeout(() => {
          if (!closingRef.current) startListening();
        }, 500);
      }
    };

    recRef.current = rec;

    try {
      rec.start();
    } catch {
      recRef.current = null;
      setPhase("idle");
    }
  }

  /* ── Lifecycle ──────────────────────────────────────────────────────── */
  useEffect(() => {
    closingRef.current = false;
    // Small delay lets the overlay paint before requesting mic permission
    const timer = setTimeout(() => startListening(), 120);

    return () => {
      clearTimeout(timer);
      closingRef.current = true;
      stopRec();
      cancelTTS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Close handler ──────────────────────────────────────────────────── */
  function handleClose() {
    closingRef.current = true;
    stopRec();
    cancelTTS();
    onCloseRef.current();
  }

  /* ── Tap orb ────────────────────────────────────────────────────────── */
  function handleOrbTap() {
    if (phase === "speaking") {
      cancelTTS();
      startListening();
    } else if (phase === "idle") {
      startListening();
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  const orbSize =
    phase === "listening"
      ? "h-36 w-36 md:h-44 md:w-44"
      : phase === "processing"
        ? "h-28 w-28 md:h-36 md:w-36"
        : "h-32 w-32 md:h-40 md:w-40";

  const orbColor =
    phase === "listening"
      ? "from-[#106534] to-[#22C55E]"
      : phase === "processing"
        ? "from-[#F59E0B] to-[#F97316]"
        : phase === "speaking"
          ? "from-[#3B82F6] to-[#8B5CF6]"
          : "from-[#94A3B8] to-[#64748B]";

  const phaseLabel =
    phase === "listening"
      ? "Listening..."
      : phase === "processing"
        ? "Thinking..."
        : phase === "speaking"
          ? "Speaking..."
          : "Tap to start";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white">
      {/* Top bar */}
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">VitalAI Voice</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          aria-label="Exit voice mode"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Center area: orb + live text */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        {/* Animated orb */}
        <button
          type="button"
          onClick={handleOrbTap}
          className="relative focus:outline-none"
          aria-label={phaseLabel}
        >
          {/* Pulse rings */}
          {phase === "listening" && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-[#22C55E]/20" />
              <span
                className="absolute -inset-4 animate-pulse rounded-full bg-[#22C55E]/10"
                style={{ animationDuration: "2s" }}
              />
            </>
          )}
          {phase === "speaking" && (
            <span
              className="absolute -inset-3 animate-pulse rounded-full bg-[#8B5CF6]/15"
              style={{ animationDuration: "1.5s" }}
            />
          )}

          <div
            className={[
              "relative rounded-full bg-gradient-to-br shadow-2xl transition-all duration-500 ease-out",
              orbSize,
              orbColor,
              phase === "listening" ? "animate-pulse" : "",
              phase === "processing"
                ? "animate-spin [animation-duration:3s]"
                : "",
            ].join(" ")}
            style={{
              boxShadow:
                phase === "listening"
                  ? "0 0 60px rgba(34,197,94,0.4)"
                  : phase === "speaking"
                    ? "0 0 60px rgba(139,92,246,0.4)"
                    : "0 0 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              {phase === "listening" && (
                <Mic className="h-10 w-10 text-white/90 drop-shadow" />
              )}
              {phase === "processing" && (
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: "0ms" }} />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: "150ms" }} />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              {phase === "speaking" && (
                <div className="flex items-end gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-full bg-white/80 animate-pulse"
                      style={{
                        height: `${12 + Math.random() * 20}px`,
                        animationDelay: `${i * 120}ms`,
                        animationDuration: "0.8s",
                      }}
                    />
                  ))}
                </div>
              )}
              {phase === "idle" && (
                <Mic className="h-10 w-10 text-white/60" />
              )}
            </div>
          </div>
        </button>

        {/* Phase label */}
        <p className="text-sm font-medium tracking-wide text-white/60 uppercase">
          {phaseLabel}
        </p>

        {/* Live transcript — word-by-word as user speaks */}
        {phase === "listening" && (transcript || interimText) && (
          <div className="max-w-lg text-center">
            <p className="text-lg font-medium leading-relaxed">
              {transcript
                .split(/\s+/)
                .filter(Boolean)
                .map((word, i) => (
                  <span
                    key={`f-${i}`}
                    className="inline-block mr-1.5 text-white/90 animate-[fadeIn_0.18s_ease-out]"
                  >
                    {word}
                  </span>
                ))}
              {interimText
                .split(/\s+/)
                .filter(Boolean)
                .map((word, i) => (
                  <span
                    key={`i-${i}`}
                    className="inline-block mr-1.5 text-white/40 animate-[fadeIn_0.18s_ease-out]"
                  >
                    {word}
                  </span>
                ))}
            </p>
          </div>
        )}

        {/* Processing — show what was sent, word-by-word */}
        {phase === "processing" && transcript && (
          <div className="max-w-lg text-center">
            <p className="text-base italic text-white/50 mb-2">You said:</p>
            <p className="text-lg font-medium leading-relaxed">
              {transcript
                .split(/\s+/)
                .filter(Boolean)
                .map((word, i) => (
                  <span
                    key={`p-${i}`}
                    className="inline-block mr-1.5 text-white/80"
                  >
                    {word}
                  </span>
                ))}
            </p>
          </div>
        )}

        {/* AI speaking — word-by-word reveal synced to TTS */}
        {phase === "speaking" && displayWords.length > 0 && (
          <div className="max-w-lg text-center px-2">
            <p className="text-lg leading-relaxed">
              {displayWords.map((word, i) => (
                <span
                  key={`s-${i}`}
                  className="inline-block mr-1.5 text-white/90 animate-[fadeIn_0.15s_ease-out]"
                >
                  {word}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="w-full px-6 pb-8 text-center">
        <p className="text-xs text-white/40">
          {phase === "listening"
            ? "Speak naturally — your message sends automatically when you pause"
            : phase === "speaking"
              ? "Tap the orb to interrupt and speak"
              : phase === "processing"
                ? "Getting a response..."
                : "Tap the orb to begin"}
        </p>
      </div>
    </div>
  );
}

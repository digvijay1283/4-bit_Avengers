"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Mic, MicOff, Send, AudioLines } from "lucide-react";

// ── Browser SpeechRecognition type shim ──────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onEnterVoiceMode?: () => void;
}

type MicState = "idle" | "listening" | "unsupported";

export default function ChatInput({ onSend, disabled, placeholder, onEnterVoiceMode }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [micState, setMicState] = useState<MicState>("idle");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect support once on mount
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) setMicState("unsupported");
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value, interimText]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    stopListening();
    onSend(trimmed);
    setValue("");
    setInterimText("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicState("idle");
    setInterimText("");
  }, []);

  function toggleMic() {
    if (micState === "unsupported") return;

    if (micState === "listening") {
      stopListening();
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setValue((prev) => (prev ? `${prev} ${final}` : final).trim());
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };

    rec.onerror = () => {
      stopListening();
    };

    rec.onend = () => {
      setMicState("idle");
      setInterimText("");
      recognitionRef.current = null;
      // Focus textarea after speech ends
      textareaRef.current?.focus();
    };

    recognitionRef.current = rec;
    rec.start();
    setMicState("listening");
  }

  // Combined display: confirmed text + live interim
  const displayValue = interimText
    ? value
      ? `${value} ${interimText}`
      : interimText
    : value;

  const isListening = micState === "listening";

  return (
    <div className="flex flex-col gap-1">
      {/* Live listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-medium text-red-500">
            Listening… speak now
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Voice mode button */}
        {micState !== "unsupported" && onEnterVoiceMode && (
          <button
            type="button"
            onClick={onEnterVoiceMode}
            disabled={disabled}
            aria-label="Enter voice conversation mode"
            title="Voice mode — hands-free conversation"
            className={[
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
              "bg-gradient-to-br from-[#106534] to-[#22C55E] text-white shadow-sm hover:shadow-md hover:scale-105",
              disabled ? "opacity-40 pointer-events-none" : "",
            ].join(" ")}
          >
            <AudioLines className="h-5 w-5" />
          </button>
        )}

        {/* Microphone button */}
        {micState !== "unsupported" && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled}
            aria-label={isListening ? "Stop recording" : "Start voice input"}
            title={isListening ? "Stop recording" : "Speak a message"}
            className={[
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
              isListening
                ? "bg-red-50 text-red-500 ring-2 ring-red-300 hover:bg-red-100"
                : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#D1FAE5] hover:text-[#106534]",
              disabled ? "opacity-40 pointer-events-none" : "",
            ].join(" ")}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Text area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={displayValue}
          onChange={(e) => {
            // If the user types while interim text is shown, commit it
            setInterimText("");
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening…" : (placeholder ?? "Type or speak a message…")}
          disabled={disabled}
          className={[
            "max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border px-4 py-3 text-sm text-[#0F172A] outline-none transition",
            "placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#D1FAE5] disabled:opacity-50",
            isListening
              ? "border-red-300 bg-red-50/40 focus:border-red-400"
              : "border-[#CBD5E1] bg-white focus:border-[#106534]",
          ].join(" ")}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#106534] text-white transition hover:bg-[#0F4D2A] disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

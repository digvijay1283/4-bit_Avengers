"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage, { type Message } from "./ChatMessage";
import ChatInput from "./ChatInput";
import { randomUUID } from "@/lib/uuid";
import { Leaf, Brain } from "lucide-react";

interface ChatWindowProps {
  userId: string;
  userName?: string;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  dailySummary?: string | null;
  isSummaryLoading?: boolean;
}

// SSE event shapes pushed by /api/chat/stream
interface SSEConnectedEvent {
  type: "connected";
  sessionId: string;
}
interface SSEProactiveEvent {
  type: "proactive";
  message: { id: string; category: string; content: string };
}
type SSEEvent = SSEConnectedEvent | SSEProactiveEvent;

const PRE_RESPONSE_STATES = [
  "Analyzing…",
  "Thinking…",
  "Typing…",
  "Working on it…",
] as const;

export default function ChatWindow({
  userId,
  userName = "there",
  initialMessages,
  onMessagesChange,
  dailySummary,
  isSummaryLoading,
}: ChatWindowProps) {
  const firstName = userName.split(" ")[0];

  const [messages, setMessages] = useState<Message[]>(() => initialMessages ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [isProactiveTyping, setIsProactiveTyping] = useState(false);
  const [preResponseIndex, setPreResponseIndex] = useState(0);
  const [chatId] = useState(() => randomUUID());
  const [sessionId] = useState(() => randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const onMessagesChangeRef = useRef(onMessagesChange);

  // true once the user has sent at least one message → switch to chat mode
  const hasUserMessages = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (!initialMessages) return;
    setMessages(initialMessages);
    setIsLoading(false);
    setIsProactiveTyping(false);
  }, [initialMessages]);

  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange;
  }, [onMessagesChange]);

  useEffect(() => {
    onMessagesChangeRef.current?.(messages);
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      setPreResponseIndex(0);
      return;
    }
    const intervalId = setInterval(() => {
      setPreResponseIndex((prev) => (prev + 1) % PRE_RESPONSE_STATES.length);
    }, 1100);
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isProactiveTyping]);

  // Open SSE stream
  useEffect(() => {
    const url = `/api/chat/stream?sessionId=${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event: MessageEvent<string>) => {
      let parsed: SSEEvent;
      try {
        parsed = JSON.parse(event.data) as SSEEvent;
      } catch {
        return;
      }
      if (parsed.type === "connected") return;
      if (parsed.type === "proactive") {
        setIsProactiveTyping(true);
        setTimeout(() => {
          setIsProactiveTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `proactive-${parsed.message.id}-${Date.now()}`,
              role: "assistant",
              content: parsed.message.content,
            },
          ]);
        }, 1200);
      }
    };
    es.onerror = () => es.close();
    return () => { es.close(); esRef.current = null; };
  }, [sessionId]);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { id: randomUUID(), role: "user", content: text }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, sessionId, userId, userChat: text }),
      });
      const payload = (await res.json()) as { ok: boolean; output?: string; message?: string };
      setMessages((prev) => [
        ...prev,
        {
          id: randomUUID(),
          role: "assistant",
          content: payload.ok && payload.output ? payload.output : (payload.message ?? "Sorry, something went wrong."),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: randomUUID(), role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-12px) scale(1.04); }
        }
        @keyframes orb-glow {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.85; }
        }
        .vitai-orb      { animation: orb-float 4s ease-in-out infinite; }
        .vitai-orb-glow { animation: orb-glow  4s ease-in-out infinite; }
      `}</style>

      <div className="flex h-full flex-col bg-background-light">
        {hasUserMessages && (
          <div className="shrink-0 flex items-center gap-2.5 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-sm px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-soft-mint">
              <Leaf className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-slate-dark">VitalAI</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Online
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
          <div className="mx-auto flex h-full max-w-2xl flex-col">
            {!hasUserMessages ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
                <div className="relative flex items-center justify-center select-none">
                  <div
                    className="vitai-orb-glow absolute h-44 w-44 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(16,101,52,0.18) 0%, rgba(209,250,229,0.10) 55%, transparent 75%)",
                    }}
                  />
                  <div
                    className="vitai-orb relative h-28 w-28 rounded-full shadow-2xl"
                    style={{
                      background:
                        "radial-gradient(circle at 38% 35%, #d1fae5 0%, #4ade80 28%, #16a34a 58%, #106534 82%, #072b16 100%)",
                      boxShadow:
                        "0 8px 48px rgba(16,101,52,0.28), 0 2px 12px rgba(16,101,52,0.18), inset 0 2px 8px rgba(255,255,255,0.35)",
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      top: "22%",
                      left: "28%",
                      width: 22,
                      height: 13,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.55)",
                      filter: "blur(3px)",
                      transform: "rotate(-30deg)",
                    }}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p
                    className="text-2xl font-semibold italic"
                    style={{ color: "#106534", letterSpacing: "-0.01em" }}
                  >
                    Hello, {firstName}!
                  </p>
                  <h1
                    className="text-3xl font-bold tracking-tight text-slate-dark"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    How can I assist you today?
                  </h1>
                </div>

                {/* Daily summary card */}
                {isSummaryLoading && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white/80 px-4 py-3 shadow-sm">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="text-xs text-[#94A3B8]">Loading your daily insights…</span>
                  </div>
                )}
                {dailySummary && !isSummaryLoading && (
                  <div className="w-full max-w-xl rounded-xl border border-[#D1FAE5] bg-white/90 shadow-sm p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">Today&apos;s Insight</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#475569]">{dailySummary}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary delay-300" />
                    <span className="ml-1">{PRE_RESPONSE_STATES[preResponseIndex]}</span>
                  </div>
                )}
                {isProactiveTyping && !isLoading && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#4ade80]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#4ade80] delay-100" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#4ade80] delay-200" />
                    <span className="ml-1 text-xs text-[#94A3B8]">VitalAI is typing…</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder={!hasUserMessages ? "Ask about your health…" : undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
}

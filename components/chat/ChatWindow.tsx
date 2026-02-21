"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage, { type Message } from "./ChatMessage";
import ChatInput from "./ChatInput";
import VoiceModeOverlay from "./VoiceModeOverlay";
import { randomUUID } from "@/lib/uuid";

interface ChatWindowProps {
  userId: string;
  /** First name / full name for the personalised greeting */
  userName?: string;
}

// SSE event shapes pushed by /api/chat/stream
interface SSEConnectedEvent {
  type: "connected";
  sessionId: string;
}
interface SSEProactiveEvent {
  type: "proactive";
  message: {
    id: string;
    category: string;
    content: string;
  };
}
type SSEEvent = SSEConnectedEvent | SSEProactiveEvent;

export default function ChatWindow({ userId, userName = "there" }: ChatWindowProps) {
  const firstName = userName.split(" ")[0];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${firstName}! I hope you're doing well 😊 How may I help you today?`,
    },
  ]);

  // isLoading = user is waiting for a reply to their own message
  const [isLoading, setIsLoading] = useState(false);
  // isProactiveTyping = bot is about to push a proactive message
  const [isProactiveTyping, setIsProactiveTyping] = useState(false);

  const [chatId] = useState(() => randomUUID());
  const [sessionId] = useState(() => randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // ── Auto-scroll whenever messages or typing indicator changes ────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isProactiveTyping]);

  // ── Open SSE stream once sessionId is ready ──────────────────────────────
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

      if (parsed.type === "connected") {
        // Channel confirmed open — nothing to render
        return;
      }

      if (parsed.type === "proactive") {
        const { content } = parsed.message;

        // Show a "typing..." indicator for ~1.2 s before the actual message
        setIsProactiveTyping(true);
        setTimeout(() => {
          setIsProactiveTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `proactive-${parsed.message.id}-${Date.now()}`,
              role: "assistant",
              content,
            },
          ]);
        }, 1200);
      }
    };

    es.onerror = () => {
      // If SSE errors (e.g. not authenticated), close silently
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId]);

  // ── Send a user message ──────────────────────────────────────────────────
  async function handleSend(text: string) {
    const userMsg: Message = {
      id: randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, sessionId, userId, userChat: text }),
      });

      const payload = (await res.json()) as {
        ok: boolean;
        output?: string;
        message?: string;
      };

      const botMsg: Message = {
        id: randomUUID(),
        role: "assistant",
        content:
          payload.ok && payload.output
            ? payload.output
            : (payload.message ?? "Sorry, something went wrong."),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: randomUUID(), role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* User-triggered loading dots */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary delay-300" />
              <span className="ml-1">Thinking…</span>
            </div>
          )}

          {/* Proactive typing indicator — shown before bot auto-pushes a message */}
          {isProactiveTyping && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-soft-mint" />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-soft-mint delay-100" />
              <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-soft-mint delay-200" />
              <span className="ml-1 text-xs text-[#94A3B8]">VitalAI is typing…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            onEnterVoiceMode={() => setVoiceMode(true)}
          />
        </div>
      </div>

      {/* Voice mode overlay */}
      {voiceMode && (
        <VoiceModeOverlay
          onSendAndGetReply={handleVoiceSend}
          onClose={() => setVoiceMode(false)}
        />
      )}
    </div>
  );
}

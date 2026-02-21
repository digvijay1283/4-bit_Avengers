"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import ChatMessage, { type Message } from "./ChatMessage";
import ChatInput from "./ChatInput";
import { randomUUID } from "@/lib/uuid";

interface ChatWindowProps {
  userId: string;
}

export default function ChatWindow({ userId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your VitalAI health companion. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId] = useState(() => randomUUID());
  const [sessionId] = useState(() => randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        body: JSON.stringify({
          chatId,
          sessionId,
          userId,
          userChat: text,
        }),
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
            : payload.message ?? "Sorry, something went wrong.",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: randomUUID(),
          role: "assistant",
          content: "Network error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#106534]" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#106534] delay-150" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#106534] delay-300" />
              <span className="ml-1">Thinking…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

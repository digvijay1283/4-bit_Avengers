"use client";

import { useCallback, useEffect, useState } from "react";
import { Leaf, MessageSquarePlus, Search, Clock } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import type { Message } from "@/components/chat/ChatMessage";
import { useDailySummary } from "@/hooks/useDailySummary";

interface AuthMe {
  ok: boolean;
  authenticated: boolean;
  user?: { userId: string; fullName?: string; email?: string; role?: string };
}

interface ConversationLog {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = "vitalai-chat-logs";

function createConversationId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getConversationTitle(messages: Message[]) {
  const firstUser = messages.find((message) => message.role === "user")?.content.trim();
  if (!firstUser) return "New chat";
  return firstUser.length > 44 ? `${firstUser.slice(0, 44)}…` : firstUser;
}

function areMessagesEqual(left: Message[], right: Message[]) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (
      left[index].id !== right[index].id ||
      left[index].role !== right[index].role ||
      left[index].content !== right[index].content
    ) {
      return false;
    }
  }
  return true;
}

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("there");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [conversationLogs, setConversationLogs] = useState<ConversationLog[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Fetch user summary from n8n webhook once per calendar day
  const { summary: dailySummary, isLoading: isSummaryLoading } = useDailySummary(userId);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as AuthMe;
          setUserId(data.user?.userId ?? "guest");
          setUserName(data.user?.fullName ?? "there");
        } else {
          setUserId("guest");
        }
      } catch {
        setUserId("guest");
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        const newId = createConversationId();
        setConversationLogs([{ id: newId, title: "New chat", messages: [], updatedAt: Date.now() }]);
        setActiveConversationId(newId);
        return;
      }
      const parsed = JSON.parse(raw) as ConversationLog[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const newId = createConversationId();
        setConversationLogs([{ id: newId, title: "New chat", messages: [], updatedAt: Date.now() }]);
        setActiveConversationId(newId);
        return;
      }
      const normalized = parsed
        .filter((log) => log && typeof log.id === "string" && Array.isArray(log.messages))
        .map((log) => ({
          id: log.id,
          title: log.title || getConversationTitle(log.messages),
          messages: log.messages,
          updatedAt: typeof log.updatedAt === "number" ? log.updatedAt : Date.now(),
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      if (normalized.length === 0) {
        const newId = createConversationId();
        setConversationLogs([{ id: newId, title: "New chat", messages: [], updatedAt: Date.now() }]);
        setActiveConversationId(newId);
        return;
      }
      setConversationLogs(normalized);
      setActiveConversationId(normalized[0].id);
    } catch {
      const newId = createConversationId();
      setConversationLogs([{ id: newId, title: "New chat", messages: [], updatedAt: Date.now() }]);
      setActiveConversationId(newId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(conversationLogs));
  }, [conversationLogs, userId]);

  function handleNewChat() {
    const newId = createConversationId();
    const newLog: ConversationLog = {
      id: newId,
      title: "New chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setConversationLogs((prev) => [newLog, ...prev]);
    setActiveConversationId(newId);
  }

  const handleMessagesChange = useCallback((messages: Message[]) => {
    if (!activeConversationId) return;
    setConversationLogs((prev) => {
      let changed = false;
      const next = prev.map((log) => {
        if (log.id !== activeConversationId) return log;
        const nextTitle = getConversationTitle(messages);
        if (areMessagesEqual(log.messages, messages) && log.title === nextTitle) {
          return log;
        }
        changed = true;
        return {
          ...log,
          messages,
          title: nextTitle,
          updatedAt: Date.now(),
        };
      });
      if (!changed) return prev;
      return [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, [activeConversationId]);

  const filteredLogs = conversationLogs.filter((log) =>
    log.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const activeLog = activeConversationId
    ? conversationLogs.find((log) => log.id === activeConversationId) ?? null
    : null;

  const firstName = userName.split(" ")[0];

  return (
    <div className="flex h-[calc(100vh-64px)] pb-20 md:pb-0 overflow-hidden bg-background-light">

      {/* ── LEFT SIDEBAR (desktop only) ────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#E2E8F0] bg-white">

        {/* Branding */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft-mint">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-slate-dark tracking-tight">VitalAI Chat</span>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-background-light px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search conversations…"
              className="min-w-0 flex-1 bg-transparent text-xs text-slate-dark placeholder:text-[#94A3B8] outline-none"
            />
          </div>
        </div>

        {/* History area */}
        <div className="flex-1 overflow-y-auto px-3 no-scrollbar">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
            Recent
          </p>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Clock className="h-7 w-7 text-[#CBD5E1]" />
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                No matching conversations
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-3">
              {filteredLogs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setActiveConversationId(log.id)}
                  className={[
                    "w-full rounded-lg px-2.5 py-2 text-left transition",
                    log.id === activeConversationId
                      ? "bg-[#ECFDF3] border border-[#CFF3DD]"
                      : "hover:bg-background-light border border-transparent",
                  ].join(" ")}
                >
                  <p className="truncate text-xs font-semibold text-slate-dark">{log.title}</p>
                  <p className="truncate text-[10px] text-[#94A3B8]">
                    {log.messages.length === 0
                      ? "No messages yet"
                      : `${log.messages.length} message${log.messages.length > 1 ? "s" : ""}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User card */}
        {userName !== "there" && (
          <div className="border-t border-[#F1F5F9] px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-mint text-xs font-bold text-primary">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-dark">{userName}</p>
              <p className="text-[10px] text-[#94A3B8]">Patient</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN CHAT AREA ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {userId === null ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm text-[#94A3B8]">Loading…</span>
            </div>
          </div>
        ) : (
          <ChatWindow
            key={activeConversationId ?? "chat"}
            userId={userId}
            userName={userName}
            initialMessages={activeLog?.messages ?? []}
            onMessagesChange={handleMessagesChange}
            dailySummary={dailySummary}
            isSummaryLoading={isSummaryLoading}
          />
        )}
      </main>
    </div>
  );
}

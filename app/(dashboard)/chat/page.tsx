"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Grab userId from the auth cookie / session.
    // For now we call a tiny endpoint that reads the JWT.
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as { userId: string };
          setUserId(data.userId);
        } else {
          // Fallback: use a guest id so the page still works
          setUserId("guest");
        }
      } catch {
        setUserId("guest");
      }
    }
    loadUser();
  }, []);

  if (!userId) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <span className="text-sm text-[#94A3B8]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pb-20 md:pb-0">
      <ChatWindow userId={userId} />
    </div>
  );
}

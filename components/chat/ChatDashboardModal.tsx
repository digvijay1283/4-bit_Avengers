"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatDashboardModal() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!mounted) return;

        if (res.ok) {
          const data = (await res.json()) as {
            ok: boolean;
            user?: { userId?: string; fullName?: string };
          };
          setUserId(data.user?.userId ?? "guest");
          return;
        }

        setUserId("guest");
      } catch {
        setUserId("guest");
      }
    }

    loadUser();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      mounted = false;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open VitalAI chat"
        className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 group"
      >
        <span className="absolute inset-0 rounded-full bg-soft-mint opacity-70 blur-md group-hover:opacity-100 transition" />
        <span className="relative inline-flex items-center gap-2 rounded-full border border-[#0F4D2A]/20 bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform duration-200 group-hover:scale-105">
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-semibold">Ask VitalAI</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-md md:items-center p-3 md:p-6">
          <div className="relative w-full max-w-4xl h-[78vh] md:h-[82vh] overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-mint text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">VitalAI Assistant</p>
                  <p className="text-xs text-[#64748B]">Preventive health support</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[calc(100%-57px)] bg-white/80">
              {userId ? (
                <ChatWindow userId={userId} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                  Loading assistant...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, Pill } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import SplineScene from "@/components/chat/SplineScene";

const FEATURE_BADGES = [
  { icon: Activity, label: "Vitals Analysis" },
  { icon: Pill, label: "Medicine Info" },
  { icon: Brain, label: "Mental Wellness" },
];

interface AuthMe {
  ok: boolean;
  authenticated: boolean;
  user?: { userId: string; fullName?: string; email?: string; role?: string };
}

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("there");

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
  }, [])

  return (
    <div className="flex h-[calc(100vh-64px)] pb-20 md:pb-0 overflow-hidden">
      {/* ── LEFT PANEL — Spline + Branding (desktop only) ───────────────── */}
      <aside className="hidden md:flex md:w-[45%] lg:w-[42%] relative flex-col items-center justify-center overflow-hidden select-none"
        style={{
          background: "linear-gradient(135deg, #106534 0%, #0a3d20 55%, #072b16 100%)",
        }}
      >
        {/* Radial background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(209,250,229,0.13) 0%, transparent 70%)",
          }}
        />

        {/* Spline 3D scene */}
        <div className="relative z-10 w-full flex-1 flex items-center justify-center">
          <SplineScene className="h-full w-full" />
        </div>

        {/* Branding overlay — sits at bottom of panel */}
        <div className="relative z-10 w-full flex flex-col items-center gap-4 px-8 pb-10 pt-2">
          <h2 className="text-2xl font-bold tracking-tight text-white text-center leading-snug">
            VitalAI Assistant
          </h2>
          <p className="text-sm text-[#A7F3D0] text-center max-w-xs leading-relaxed">
            Your intelligent preventive health companion
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {FEATURE_BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-soft-mint/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-soft-mint backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL — Chat interface ────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-w-0 bg-background-light overflow-hidden">
        {/* Mobile-only top branding strip */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-white shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-mint">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-dark">VitalAI Assistant</p>
            <p className="text-xs text-[#64748B]">Preventive health support</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Online
          </span>
        </div>

        {/* Chat window fills remaining height */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {userId === null ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm text-[#94A3B8]">Loading assistant…</span>
              </div>
            </div>
          ) : (
            <ChatWindow userId={userId} userName={userName} />
          )}
        </div>
      </main>
    </div>
  );
}

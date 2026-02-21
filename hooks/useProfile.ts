"use client";

import { useCallback, useEffect, useState } from "react";

/* ─── Profile type returned by /api/profile ─────────────────────────── */
export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  bloodType: string | null;
  weight: string | null;
  height: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  role: "user" | "doctor";
  status: string;
  createdAt: string;
  updatedAt: string;
}

type ProfileStatus = "loading" | "done" | "error";

/* ─── Hook ──────────────────────────────────────────────────────────── */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");

  const fetchProfile = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        profile?: UserProfile;
      };
      if (data.ok && data.profile) {
        setProfile(data.profile);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  const updateProfile = useCallback(
    async (fields: Partial<UserProfile>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as {
        ok: boolean;
        profile?: UserProfile;
        message?: string;
      };
      if (data.ok && data.profile) {
        setProfile(data.profile);
        return { ok: true as const };
      }
      return { ok: false as const, message: data.message ?? "Update failed" };
    },
    [],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, status, refresh: fetchProfile, updateProfile };
}

/* ─── Helpers ───────────────────────────────────────────────────────── */
export function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

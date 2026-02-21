"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

type LoginRole = "user" | "doctor";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "doctor" ? "doctor" : "user";

  const [activeRole, setActiveRole] = useState<LoginRole>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: { role?: LoginRole };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Unable to sign in.");
        return;
      }

      const serverRole = payload.user?.role ?? "user";

      /* Block cross-role login attempts */
      if (activeRole === "doctor" && serverRole !== "doctor") {
        setError("This account is not registered as a doctor.");
        return;
      }
      if (activeRole === "user" && serverRole === "doctor") {
        setError("This is a doctor account. Please switch to Doctor Login.");
        return;
      }

      const nextPath = serverRole === "doctor" ? "/doctor" : "/dashboard";
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDoctor = activeRole === "doctor";

  return (
    <main>
      {/* Role Toggle */}
      <div className="mb-8 flex items-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
        <button
          type="button"
          onClick={() => {
            setActiveRole("user");
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            !isDoctor
              ? "bg-[#106534] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <span className="material-symbols-outlined mr-1 align-middle text-base">
            person
          </span>
          Patient Login
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveRole("doctor");
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            isDoctor
              ? "bg-[#1E40AF] text-white shadow-sm"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <span className="material-symbols-outlined mr-1 align-middle text-base">
            stethoscope
          </span>
          Doctor Login
        </button>
      </div>

      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#1E293B]">
          {isDoctor ? "Doctor Portal" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-[#64748B]">
          {isDoctor
            ? "Sign in to access the VitalAI doctor console."
            : "Sign in to continue to your VitalAI dashboard."}
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#334155]"
          >
            {isDoctor ? "Doctor Email" : "Email"}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={isDoctor ? "doctor@hospital.com" : "you@example.com"}
            className={`h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] outline-none transition ${
              isDoctor
                ? "focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100"
                : "focus:border-[#106534] focus:ring-2 focus:ring-[#D1FAE5]"
            }`}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#334155]"
            >
              Password
            </label>
            <Link
              href="#"
              className={`text-xs font-semibold hover:underline ${
                isDoctor ? "text-[#1E40AF]" : "text-[#106534]"
              }`}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder=""
            className={`h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] outline-none transition ${
              isDoctor
                ? "focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100"
                : "focus:border-[#106534] focus:ring-2 focus:ring-[#D1FAE5]"
            }`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition ${
            isDoctor
              ? "bg-[#1E40AF] hover:bg-[#1E3A8A]"
              : "bg-[#106534] hover:bg-[#0F4D2A]"
          }`}
        >
          {isSubmitting
            ? "Signing in..."
            : isDoctor
              ? "Sign in as Doctor"
              : "Sign in"}
        </button>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E2E8F0]" />
        <span className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
          or
        </span>
        <div className="h-px flex-1 bg-[#E2E8F0]" />
      </div>

      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white text-sm font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC]"
      >
        <span className="material-symbols-outlined text-lg">login</span>
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-[#64748B]">
        {isDoctor ? (
          <>
            Need a doctor account?{" "}
            <Link
              href="/signup?role=doctor"
              className="font-semibold text-[#1E40AF] hover:underline"
            >
              Register as Doctor
            </Link>
          </>
        ) : (
          <>
            {"Don't have an account? "}
            <Link
              href="/signup"
              className="font-semibold text-[#106534] hover:underline"
            >
              Create one
            </Link>
          </>
        )}
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
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
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Unable to sign in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#1E293B]">Welcome back</h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Sign in to continue to your VitalAI dashboard.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-[#334155]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#106534] focus:ring-2 focus:ring-[#D1FAE5]"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-[#334155]">
              Password
            </label>
            <Link href="#" className="text-xs font-semibold text-[#106534] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#106534] focus:ring-2 focus:ring-[#D1FAE5]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#106534] text-sm font-semibold text-white transition hover:bg-[#0F4D2A]"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E2E8F0]" />
        <span className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">or</span>
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
        Don’t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#106534] hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}

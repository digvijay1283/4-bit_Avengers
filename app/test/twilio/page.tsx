"use client";

import { useState, useEffect } from "react";

interface CallResult {
  success?: boolean;
  callSid?: string;
  status?: string;
  to?: string;
  from?: string;
  error?: string;
  code?: number;
}

export default function TwilioTestPage() {
  const [phoneNumber, setPhoneNumber] = useState("+918286688286");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [twilioConfigured, setTwilioConfigured] = useState<boolean | null>(null);
  const [twilioPhone, setTwilioPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/twilio/status")
      .then((res) => res.json())
      .then((data) => {
        setTwilioConfigured(data.configured);
        setTwilioPhone(data.phoneNumber);
      })
      .catch(() => setTwilioConfigured(false));
  }, []);

  const handleCall = async () => {
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phoneNumber }),
      });

      const data: CallResult = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error — failed to reach API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            🔊 Twilio Call Test
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            VitalAI — AI Calling Agent Integration
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              twilioConfigured === null
                ? "bg-yellow-400"
                : twilioConfigured
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-[var(--color-muted-foreground)]">
            {twilioConfigured === null
              ? "Checking config…"
              : twilioConfigured
              ? `Connected — ${twilioPhone}`
              : "Twilio not configured"}
          </span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-6 space-y-5 shadow-sm">
          {/* Phone Input */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[var(--color-muted-foreground)]"
            >
              Recipient Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
            />
          </div>

          {/* Call Button */}
          <button
            onClick={handleCall}
            disabled={loading || !twilioConfigured}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Initiating Call…
              </span>
            ) : (
              "📞 Make Test Call"
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl border p-5 space-y-2 text-sm ${
              result.success
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <h3
              className={`font-semibold ${
                result.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.success ? "✅ Call Initiated" : "❌ Call Failed"}
            </h3>

            {result.success ? (
              <div className="space-y-1 text-[var(--color-muted-foreground)]">
                <p>
                  <span className="font-medium">Call SID:</span>{" "}
                  <code className="text-xs bg-[var(--color-muted)] px-1.5 py-0.5 rounded">
                    {result.callSid}
                  </code>
                </p>
                <p>
                  <span className="font-medium">Status:</span> {result.status}
                </p>
                <p>
                  <span className="font-medium">To:</span> {result.to}
                </p>
                <p>
                  <span className="font-medium">From:</span> {result.from}
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-[var(--color-muted-foreground)]">
                <p>{result.error}</p>
                {result.code && (
                  <p>
                    <span className="font-medium">Error Code:</span>{" "}
                    {result.code}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

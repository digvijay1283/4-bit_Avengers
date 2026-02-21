"use client";

import { useState } from "react";

type OcrResult = {
  success: boolean;
  fileName?: string;
  rawText?: string;
  extracted?: {
    hospitalName?: string;
    reportType?: string;
    visit: {
      doctorName?: string;
      specialization?: string;
      visitDate?: string;
    };
    patient: {
      fullName?: string;
      birthDate?: string;
      medNumber?: string;
      ihi?: string;
      phone?: string;
      email?: string;
    };
    sections: {
      assessment?: string;
      diagnosis?: string;
      prescription?: string;
    };
    keyInsights: string[];
  };
  error?: string;
};

export default function OcrTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      const data: OcrResult = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Failed to connect to OCR API." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">🧾 OCR Test — Medical Reports</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Upload report image(s) one by one to extract meaningful medical information.
          </p>
        </header>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-5 space-y-4">
          <div className="space-y-2">
            <label htmlFor="report" className="text-sm font-medium">
              Medical Report Image (JPG / PNG / WEBP)
            </label>
            <input
              id="report"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={!file || loading}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-50"
          >
            {loading ? "Extracting…" : "Extract Report Data"}
          </button>
        </section>

        {result && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] p-5 space-y-3">
              <h2 className="text-lg font-semibold">Structured Output</h2>

              {!result.success ? (
                <p className="text-sm text-red-600">{result.error}</p>
              ) : (
                <div className="text-sm space-y-3">
                  <p><span className="font-medium">File:</span> {result.fileName}</p>
                  <p><span className="font-medium">Hospital:</span> {result.extracted?.hospitalName ?? "-"}</p>
                  <p><span className="font-medium">Report Type:</span> {result.extracted?.reportType ?? "-"}</p>

                  <div>
                    <p className="font-medium">Visit Info</p>
                    <p>Doctor: {result.extracted?.visit.doctorName ?? "-"}</p>
                    <p>Specialization: {result.extracted?.visit.specialization ?? "-"}</p>
                    <p>Date: {result.extracted?.visit.visitDate ?? "-"}</p>
                  </div>

                  <div>
                    <p className="font-medium">Patient Info</p>
                    <p>Name: {result.extracted?.patient.fullName ?? "-"}</p>
                    <p>DOB: {result.extracted?.patient.birthDate ?? "-"}</p>
                    <p>Med Number: {result.extracted?.patient.medNumber ?? "-"}</p>
                    <p>IHI: {result.extracted?.patient.ihi ?? "-"}</p>
                    <p>Phone: {result.extracted?.patient.phone ?? "-"}</p>
                    <p>Email: {result.extracted?.patient.email ?? "-"}</p>
                  </div>

                  <div>
                    <p className="font-medium">Key Insights</p>
                    {result.extracted?.keyInsights?.length ? (
                      <ul className="list-disc pl-5">
                        {result.extracted.keyInsights.map((insight) => (
                          <li key={insight}>{insight}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-5 space-y-3">
              <h2 className="text-lg font-semibold">Raw OCR Text</h2>
              <pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--color-muted)] p-3 text-xs whitespace-pre-wrap">
                {result.rawText || result.error || "No output"}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

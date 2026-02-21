"use client";

import { useState, useEffect, useCallback } from "react";
import {
  QrCode,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
  Clock,
  Shield,
  X,
  RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/* ────────────────────────────── types ────────────────────────────── */
type Report = {
  reportId: string;
  fileName: string;
  status: "processing" | "completed" | "failed";
  createdAt: string;
};

type ShareResult = {
  token: string;
  shareCode: string;
  expiresAt: string;
};

/* ───────────────────────────── page ─────────────────────────────── */
export default function SharePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");

  /* ── fetch user's reports ────────────────────────────────────────── */
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── countdown timer for active QR ──────────────────────────────── */
  useEffect(() => {
    if (!shareResult) return;

    const tick = () => {
      const diff = new Date(shareResult.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Expired");
        setShareResult(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shareResult]);

  /* ── toggle report selection ─────────────────────────────────────── */
  const toggleReport = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map((r) => r.reportId)));
    }
  };

  /* ── generate share QR ──────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    setError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: Array.from(selectedIds) }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to generate QR.");
        return;
      }

      setShareResult({
        token: data.token,
        shareCode: data.shareCode,
        expiresAt: data.expiresAt,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  /* ── reset to pick new reports ──────────────────────────────────── */
  const handleReset = () => {
    setShareResult(null);
    setSelectedIds(new Set());
    setCountdown("");
  };

  /* ── helpers ─────────────────────────────────────────────────────── */
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  /* ── QR value: the share token that the doctor scanner will read ── */
  const qrValue = shareResult
    ? `share:${shareResult.shareCode}`
    : "";

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Share2 size={24} className="text-[#106534]" />
          </div>
          Share with Doctor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select reports to share, then show the QR code to your doctor for instant access.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── QR Result View ──────────────────────────────────────────── */}
      {shareResult ? (
        <div className="flex flex-col items-center gap-6">
          {/* QR Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5 max-w-sm w-full">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <QrCode size={28} className="text-[#106534]" />
            </div>

            <h2 className="text-lg font-bold text-slate-800 text-center">
              Show this QR to your Doctor
            </h2>

            {/* QR code */}
            <div className="p-4 bg-white rounded-xl border-2 border-emerald-200">
              <QRCodeSVG
                value={qrValue}
                size={220}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#106534"
              />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-amber-500" />
              <span className="text-slate-600">
                Expires in <strong className="text-amber-600">{countdown}</strong>
              </span>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Patient ID (Manual Entry)
              </p>
              <p className="mt-1 text-sm font-mono font-semibold text-slate-800 break-all">
                {shareResult.shareCode}
              </p>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 bg-emerald-50 rounded-xl px-4 py-3 w-full">
              <Shield size={16} className="text-[#106534] mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600">
                Only the <strong>{selectedIds.size} selected report{selectedIds.size > 1 ? "s" : ""}</strong> will
                be visible. The QR expires in 30 minutes.
              </p>
            </div>

            {/* Shared report names */}
            <div className="w-full border-t border-slate-100 pt-4 space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Shared Reports
              </p>
              {reports
                .filter((r) => selectedIds.has(r.reportId))
                .map((r) => (
                  <div
                    key={r.reportId}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <CheckCircle2 size={14} className="text-[#106534] shrink-0" />
                    <span className="truncate">{r.fileName}</span>
                  </div>
                ))}
            </div>

            {/* Generate new */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-[#106534] hover:underline font-medium mt-2"
            >
              <RotateCcw size={14} /> Generate new QR
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Report Selection ──────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#106534]" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No reports to share</p>
              <p className="text-sm text-slate-400 mt-1">
                Upload reports first, then come back to share them.
              </p>
            </div>
          ) : (
            <>
              {/* Select all header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                  <strong>{selectedIds.size}</strong> of {reports.length} selected
                </p>
                <button
                  onClick={selectAll}
                  className="text-sm text-[#106534] hover:underline font-medium"
                >
                  {selectedIds.size === reports.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              {/* Report list with checkboxes */}
              <div className="space-y-2 mb-8">
                {reports.map((report) => {
                  const selected = selectedIds.has(report.reportId);
                  return (
                    <button
                      key={report.reportId}
                      onClick={() => toggleReport(report.reportId)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left
                        ${
                          selected
                            ? "border-[#106534] bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                          ${
                            selected
                              ? "bg-[#106534] border-[#106534]"
                              : "border-slate-300"
                          }`}
                      >
                        {selected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Icon */}
                      <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                        <FileText size={16} className="text-[#106534]" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate text-sm">
                          {report.fileName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {fmtDate(report.createdAt)}
                        </p>
                      </div>

                      {/* Status */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                          ${
                            report.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : report.status === "processing"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                      >
                        {report.status === "completed"
                          ? "Extracted"
                          : report.status === "processing"
                            ? "Processing"
                            : "Failed"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Generate QR button */}
              <div className="sticky bottom-20 z-10">
                <button
                  onClick={handleGenerate}
                  disabled={selectedIds.size === 0 || generating}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#106534] text-white py-4 font-semibold text-base shadow-lg hover:bg-[#0d5229] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating QR...
                    </>
                  ) : (
                    <>
                      <QrCode size={20} />
                      Generate QR Code
                      {selectedIds.size > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                          {selectedIds.size} report{selectedIds.size > 1 ? "s" : ""}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

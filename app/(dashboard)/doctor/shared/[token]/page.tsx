"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Shield,
  Clock,
  Hospital,
  Stethoscope,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowLeft,
  X,
  Eye,
} from "lucide-react";

/* ────────────────────────────── types ────────────────────────────── */
type ExtractedMedicalInfo = {
  hospitalName?: string;
  reportType?: string;
  visit?: { doctorName?: string; specialization?: string; visitDate?: string };
  patient?: {
    fullName?: string;
    birthDate?: string;
    medNumber?: string;
    ihi?: string;
    phone?: string;
    email?: string;
  };
  sections?: { assessment?: string; diagnosis?: string; prescription?: string };
  keyInsights?: string[];
};

type Report = {
  reportId: string;
  fileName: string;
  fileUrl: string;
  rawText: string;
  extractedData: ExtractedMedicalInfo | null;
  status: string;
  createdAt: string;
};

type PatientInfo = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
};

/* ───────────────────────────── page ─────────────────────────────── */
export default function SharedPatientPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchSharedData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to load shared data.");
          return;
        }
        setPatient(json.patient);
        setReports(json.reports);
        setExpiresAt(json.expiresAt);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchSharedData();
  }, [token]);

  /* ── helpers ─────────────────────────────────────────────────────── */
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ── loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#106534]" />
          <p className="text-sm text-slate-500">Loading shared patient data…</p>
        </div>
      </div>
    );
  }

  /* ── error ────────────────────────────────────────────────────────── */
  if (error || !patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            {error?.includes("expired") ? "QR Code Expired" : "Could Not Load Data"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {error || "Something went wrong loading this shared view."}
          </p>
          <Link
            href="/doctor"
            className="inline-flex items-center gap-2 rounded-xl bg-[#106534] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0d5229] transition"
          >
            <ArrowLeft size={16} /> Back to Console
          </Link>
        </div>
      </div>
    );
  }

  /* ── main render ─────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
      {/* Back */}
      <Link
        href="/doctor"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#106534] transition"
      >
        <ArrowLeft size={16} /> Back to Console
      </Link>

      {/* Session badge */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <Shield size={18} className="text-[#106534] shrink-0" />
        <p className="text-sm text-slate-700 flex-1">
          <strong>Shared View</strong> — The patient shared {reports.length} report
          {reports.length !== 1 ? "s" : ""} with you.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-amber-600 shrink-0">
          <Clock size={14} />
          Expires {fmtDateTime(expiresAt)}
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <User size={20} className="text-[#106534]" /> Patient Profile
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            {patient.avatarUrl ? (
              <img
                src={patient.avatarUrl}
                alt={patient.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[#106534]">
                {patient.fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-slate-400" />
              <span className="text-slate-500">Name:</span>
              <span className="font-medium text-slate-800">{patient.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-400" />
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-800">{patient.email}</span>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-slate-400" />
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{patient.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-slate-500">Member since:</span>
              <span className="font-medium text-slate-800">{fmtDate(patient.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Shared Reports ───────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-[#106534]" />
          Shared Reports
          <span className="text-sm font-normal text-slate-400">({reports.length})</span>
        </h2>

        {reports.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No reports in this share session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const ext = report.extractedData;
              const visit = ext?.visit ?? {};
              const sections = ext?.sections ?? {};
              const keyInsights = ext?.keyInsights ?? [];

              return (
                <div
                  key={report.reportId}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0">
                      <FileText size={20} className="text-[#106534]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{report.fileName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={12} /> {fmtDateTime(report.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-[#106534] transition-colors"
                        title="View full details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === report.reportId ? null : report.reportId)
                        }
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Toggle preview"
                      >
                        {expandedId === report.reportId ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable preview */}
                  {expandedId === report.reportId && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 rounded-b-xl space-y-3">
                      {/* Quick chips */}
                      <div className="flex flex-wrap gap-2">
                        {ext?.hospitalName && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#106534] px-2.5 py-1 rounded-lg text-xs font-medium">
                            <Hospital size={12} />
                            {ext.hospitalName}
                          </span>
                        )}
                        {ext?.reportType && (
                          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                            <FileText size={12} />
                            {ext.reportType}
                          </span>
                        )}
                        {visit.doctorName && (
                          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                            <Stethoscope size={12} />
                            Dr. {visit.doctorName}
                          </span>
                        )}
                      </div>

                      {/* Sections */}
                      {(sections.assessment || sections.diagnosis || sections.prescription) && (
                        <div className="space-y-2">
                          {sections.assessment && (
                            <SectionBlock title="Assessment" text={sections.assessment} />
                          )}
                          {sections.diagnosis && (
                            <SectionBlock title="Diagnosis" text={sections.diagnosis} />
                          )}
                          {sections.prescription && (
                            <SectionBlock title="Prescription" text={sections.prescription} />
                          )}
                        </div>
                      )}

                      {/* Key Insights */}
                      {keyInsights.length > 0 && (
                        <div className="space-y-1">
                          {keyInsights.map((insight, i) => (
                            <p
                              key={i}
                              className="text-xs text-slate-600 flex items-start gap-1.5"
                            >
                              <CheckCircle2
                                size={12}
                                className="text-[#106534] mt-0.5 shrink-0"
                              />
                              {insight}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Raw text */}
                      {report.rawText && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                            Show raw OCR text
                          </summary>
                          <pre className="mt-2 bg-slate-100 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {report.rawText}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────────── */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

/* ────────────── Detail Modal ─────────────────────────────────────── */
function ReportDetailModal({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const ext = report.extractedData;
  const visit = ext?.visit ?? {};
  const patient = ext?.patient ?? {};
  const sections = ext?.sections ?? {};
  const keyInsights = ext?.keyInsights ?? [];

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">{report.fileName}</h3>
            <p className="text-xs text-slate-500">{fmtDateTime(report.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* File link */}
          <a
            href={report.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#106534] hover:underline font-medium"
          >
            <ExternalLink size={16} /> View original file
          </a>

          {ext && (
            <>
              {(ext.hospitalName || ext.reportType) && (
                <div className="flex flex-wrap gap-3">
                  {ext.hospitalName && (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm">
                      <Hospital size={16} className="text-[#106534]" />
                      {ext.hospitalName}
                    </div>
                  )}
                  {ext.reportType && (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm">
                      <FileText size={16} className="text-[#106534]" />
                      {ext.reportType}
                    </div>
                  )}
                </div>
              )}

              {(visit.doctorName || visit.visitDate) && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                    <Stethoscope size={16} /> Visit Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {visit.doctorName && (
                      <div>
                        <span className="text-slate-500">Doctor:</span> {visit.doctorName}
                      </div>
                    )}
                    {visit.specialization && (
                      <div>
                        <span className="text-slate-500">Specialty:</span> {visit.specialization}
                      </div>
                    )}
                    {visit.visitDate && (
                      <div>
                        <span className="text-slate-500">Date:</span> {visit.visitDate}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {patient.fullName && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-sm text-slate-700 mb-2">
                    Patient Info (from report)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {patient.fullName && (
                      <div>
                        <span className="text-slate-500">Name:</span> {patient.fullName}
                      </div>
                    )}
                    {patient.birthDate && (
                      <div>
                        <span className="text-slate-500">DOB:</span> {patient.birthDate}
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <span className="text-slate-500">Phone:</span> {patient.phone}
                      </div>
                    )}
                    {patient.email && (
                      <div>
                        <span className="text-slate-500">Email:</span> {patient.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(sections.assessment || sections.diagnosis || sections.prescription) && (
                <div className="space-y-3">
                  {sections.assessment && (
                    <SectionBlock title="Assessment" text={sections.assessment} />
                  )}
                  {sections.diagnosis && (
                    <SectionBlock title="Diagnosis" text={sections.diagnosis} />
                  )}
                  {sections.prescription && (
                    <SectionBlock title="Prescription" text={sections.prescription} />
                  )}
                </div>
              )}

              {keyInsights.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <h4 className="font-medium text-sm text-[#106534] mb-2">Key Insights</h4>
                  <ul className="space-y-1">
                    {keyInsights.map((insight, i) => (
                      <li
                        key={i}
                        className="text-sm text-slate-700 flex items-start gap-2"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-[#106534] mt-0.5 shrink-0"
                        />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {report.rawText && (
            <div>
              <h4 className="font-medium text-sm text-slate-700 mb-2">Raw OCR Text</h4>
              <pre className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {report.rawText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────── Section Block ────────────────────────────────────── */
function SectionBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h5 className="font-medium text-sm text-slate-700 mb-1">{title}</h5>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

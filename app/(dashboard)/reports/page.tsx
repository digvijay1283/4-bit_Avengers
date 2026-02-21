"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  Calendar,
  Hospital,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

/* ────────────────────────────── types ────────────────────────────── */
type ExtractedMedicalInfo = {
  hospitalName?: string;
  reportType?: string;
  visit: { doctorName?: string; specialization?: string; visitDate?: string };
  patient: {
    fullName?: string;
    birthDate?: string;
    medNumber?: string;
    ihi?: string;
    phone?: string;
    email?: string;
  };
  sections: { assessment?: string; diagnosis?: string; prescription?: string };
  keyInsights: string[];
};

type Report = {
  reportId: string;
  fileName: string;
  fileUrl: string;
  rawText: string;
  extractedData: ExtractedMedicalInfo | null;
  status: "processing" | "completed" | "failed";
  createdAt: string;
};

/* ───────────────────────────── page ─────────────────────────────── */
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── fetch reports ──────────────────────────────────────────────── */
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch {
      console.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── upload handler ─────────────────────────────────────────────── */
  const handleUpload = async (file: File) => {
    setError("");
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setError("Unsupported file. Please upload JPG, PNG, WEBP, or PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading to cloud...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress("Uploading & extracting text...");

      const res = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Upload failed.");
        return;
      }

      setUploadProgress("Done!");
      setReports((prev) => [data.report, ...prev]);

      // Reset after brief success display
      setTimeout(() => {
        setUploading(false);
        setUploadProgress("");
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
      setUploading(false);
      setUploadProgress("");
    }
  };

  /* ── delete handler ─────────────────────────────────────────────── */
  const handleDelete = async (reportId: string) => {
    if (!confirm("Delete this report permanently?")) return;

    try {
      const res = await fetch(`/api/reports?reportId=${reportId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter((r) => r.reportId !== reportId));
        if (selectedReport?.reportId === reportId) setSelectedReport(null);
      }
    } catch {
      console.error("Delete failed");
    }
  };

  /* ── drag & drop ────────────────────────────────────────────────── */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleUpload(e.target.files[0]);
    e.target.value = "";
  };

  /* ── helpers ────────────────────────────────────────────────────── */
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (status: Report["status"]) => {
    const map = {
      completed: {
        bg: "bg-emerald-100 text-emerald-700",
        icon: <CheckCircle2 size={14} />,
        label: "Extracted",
      },
      processing: {
        bg: "bg-amber-100 text-amber-700",
        icon: <Loader2 size={14} className="animate-spin" />,
        label: "Processing",
      },
      failed: {
        bg: "bg-red-100 text-red-700",
        icon: <AlertCircle size={14} />,
        label: "Failed",
      },
    };
    const s = map[status];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg}`}
      >
        {s.icon} {s.label}
      </span>
    );
  };

  /* ── detail modal ───────────────────────────────────────────────── */
  const DetailModal = ({ report }: { report: Report }) => {
    const ext = report.extractedData;
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="font-semibold text-lg text-slate-800">
                {report.fileName}
              </h3>
              <p className="text-xs text-slate-500">{fmtDate(report.createdAt)}</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
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
              <ExternalLink size={16} /> View original file on Cloudinary
            </a>

            {ext && (
              <>
                {/* Hospital / Report type */}
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

                {/* Visit */}
                {(ext.visit.doctorName || ext.visit.visitDate) && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                      <Stethoscope size={16} /> Visit Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {ext.visit.doctorName && (
                        <div>
                          <span className="text-slate-500">Doctor:</span>{" "}
                          {ext.visit.doctorName}
                        </div>
                      )}
                      {ext.visit.specialization && (
                        <div>
                          <span className="text-slate-500">Specialty:</span>{" "}
                          {ext.visit.specialization}
                        </div>
                      )}
                      {ext.visit.visitDate && (
                        <div>
                          <span className="text-slate-500">Date:</span>{" "}
                          {ext.visit.visitDate}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient */}
                {ext.patient.fullName && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-medium text-sm text-slate-700 mb-2">
                      Patient Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {ext.patient.fullName && (
                        <div>
                          <span className="text-slate-500">Name:</span>{" "}
                          {ext.patient.fullName}
                        </div>
                      )}
                      {ext.patient.birthDate && (
                        <div>
                          <span className="text-slate-500">DOB:</span>{" "}
                          {ext.patient.birthDate}
                        </div>
                      )}
                      {ext.patient.phone && (
                        <div>
                          <span className="text-slate-500">Phone:</span>{" "}
                          {ext.patient.phone}
                        </div>
                      )}
                      {ext.patient.email && (
                        <div>
                          <span className="text-slate-500">Email:</span>{" "}
                          {ext.patient.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {(ext.sections.assessment ||
                  ext.sections.diagnosis ||
                  ext.sections.prescription) && (
                  <div className="space-y-3">
                    {ext.sections.assessment && (
                      <SectionBlock title="Assessment" text={ext.sections.assessment} />
                    )}
                    {ext.sections.diagnosis && (
                      <SectionBlock title="Diagnosis" text={ext.sections.diagnosis} />
                    )}
                    {ext.sections.prescription && (
                      <SectionBlock title="Prescription" text={ext.sections.prescription} />
                    )}
                  </div>
                )}

                {/* Key Insights */}
                {ext.keyInsights.length > 0 && (
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="font-medium text-sm text-[#106534] mb-2">
                      Key Insights
                    </h4>
                    <ul className="space-y-1">
                      {ext.keyInsights.map((insight, i) => (
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

            {/* Raw text */}
            {report.rawText && (
              <div>
                <h4 className="font-medium text-sm text-slate-700 mb-2">
                  Raw OCR Text
                </h4>
                <pre className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {report.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <FileText size={24} className="text-[#106534]" />
          </div>
          My Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload medical reports to extract details with OCR. Reports are stored securely on the cloud.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative mb-8 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${
            dragActive
              ? "border-[#106534] bg-emerald-50 scale-[1.01]"
              : "border-slate-300 hover:border-[#106534] hover:bg-emerald-50/50"
          }
          ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-[#106534] animate-spin" />
            <p className="text-sm font-medium text-[#106534]">{uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-emerald-100 rounded-2xl">
              <CloudUpload size={32} className="text-[#106534]" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                Drop your report here or{" "}
                <span className="text-[#106534] underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                JPG, PNG, WEBP, or PDF &middot; Max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#106534]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
            <Upload size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No reports yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Upload your first medical report to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.reportId}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0">
                  <FileText size={20} className="text-[#106534]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {report.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {fmtDate(report.createdAt)}
                    </span>
                    {statusBadge(report.status)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-[#106534] transition-colors"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === report.reportId ? null : report.reportId
                      )
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
                  <button
                    onClick={() => handleDelete(report.reportId)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Expandable preview */}
              {expandedId === report.reportId && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 rounded-b-xl">
                  {report.extractedData ? (
                    <div className="space-y-3">
                      {/* Quick facts */}
                      <div className="flex flex-wrap gap-2">
                        {report.extractedData.hospitalName && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#106534] px-2.5 py-1 rounded-lg text-xs font-medium">
                            <Hospital size={12} />
                            {report.extractedData.hospitalName}
                          </span>
                        )}
                        {report.extractedData.reportType && (
                          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                            <FileText size={12} />
                            {report.extractedData.reportType}
                          </span>
                        )}
                        {report.extractedData.visit.doctorName && (
                          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                            <Stethoscope size={12} />
                            Dr. {report.extractedData.visit.doctorName}
                          </span>
                        )}
                      </div>

                      {/* Key insights */}
                      {report.extractedData.keyInsights.length > 0 && (
                        <div className="space-y-1">
                          {report.extractedData.keyInsights.map((insight, i) => (
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
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No extracted data available for this report.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedReport && <DetailModal report={selectedReport} />}
    </div>
  );
}

/* ────────────── Section Block sub-component ──────────────────────── */
function SectionBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h5 className="font-medium text-sm text-slate-700 mb-1">{title}</h5>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

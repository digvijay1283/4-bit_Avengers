"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ClipboardList,
} from "lucide-react";

type Report = {
  id: string;
  title: string;
  date: string;
  summary: string;
  fileUrl?: string;
  type: string;
  status?: string;
  severity: "normal" | "attention" | "critical";
};

type Props = {
  reports?: Report[];
};

const severityBadge: Record<string, string> = {
  normal: "bg-green-50 text-green-600 border-green-200",
  attention: "bg-amber-50 text-amber-600 border-amber-200",
  critical: "bg-red-50 text-red-500 border-red-200",
};

const severityLabel: Record<string, string> = {
  normal: "Normal",
  attention: "Needs Attention",
  critical: "Critical",
};

export default function PatientReportSummary({ reports }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const hasData = reports && reports.length > 0;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div>
          <h3 className="font-semibold text-[#0F172A]">Reports & Summaries</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {hasData
              ? `${reports.length} report${reports.length > 1 ? "s" : ""} — AI-summarised lab results and doctor notes`
              : "No reports available yet"}
          </p>
        </div>
        {hasData && (
          <span className="text-xs text-primary font-medium">
            {reports.filter((r) => r.severity === "critical").length} critical
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
            <ClipboardList className="h-6 w-6 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#64748B]">
            No reports uploaded
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Reports will appear once the patient uploads medical documents
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9]">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                className="px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 mt-0.5">
                      {report.severity === "critical" ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {report.title}
                        </p>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${severityBadge[report.severity]}`}
                        >
                          {severityLabel[report.severity]}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {fmtDate(report.date)} •{" "}
                        {report.type === "note" ? "Doctor Note" : "Lab Result"}
                      </p>

                      {/* Summary — truncated by default, expandable */}
                      <p
                        className={`text-sm text-[#475569] mt-2 leading-relaxed ${
                          !isExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {report.summary}
                      </p>

                      {report.summary.length > 120 && (
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : report.id)
                          }
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" /> Read more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {report.fileUrl && (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-primary transition-colors"
                        title="View report"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-primary transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

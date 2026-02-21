"use client";

import { FileText, ChevronRight, Download, AlertCircle } from "lucide-react";

type Report = {
  id: string;
  title: string;
  date: string;
  summary: string;
  type: "lab" | "report" | "note";
  severity: "normal" | "attention" | "critical";
};

const mockReports: Report[] = [
  {
    id: "r1",
    title: "Complete Blood Count (CBC)",
    date: "Feb 20, 2026",
    summary:
      "Hemoglobin slightly below normal range (11.8 g/dL). WBC count normal (7,200/µL). Platelet count within range. Recommend iron supplementation and follow-up in 4 weeks.",
    type: "lab",
    severity: "attention",
  },
  {
    id: "r2",
    title: "Lipid Panel",
    date: "Feb 18, 2026",
    summary:
      "Total cholesterol: 215 mg/dL (borderline). LDL: 138 mg/dL (near optimal). HDL: 52 mg/dL. Triglycerides: 125 mg/dL. Dietary changes recommended.",
    type: "lab",
    severity: "attention",
  },
  {
    id: "r3",
    title: "HbA1c Test",
    date: "Feb 15, 2026",
    summary:
      "HbA1c at 6.2% — pre-diabetic range. Fasting glucose: 118 mg/dL. Recommend lifestyle modifications, regular exercise, and recheck in 3 months.",
    type: "lab",
    severity: "critical",
  },
  {
    id: "r4",
    title: "Thyroid Function Panel",
    date: "Feb 10, 2026",
    summary:
      "TSH: 2.4 mIU/L (normal). Free T4: 1.2 ng/dL (normal). Free T3: 3.1 pg/mL (normal). No thyroid abnormalities detected.",
    type: "lab",
    severity: "normal",
  },
  {
    id: "r5",
    title: "Doctor's Note — Follow-up Visit",
    date: "Feb 8, 2026",
    summary:
      "Patient reports mild fatigue, occasional dizziness. Vitals stable. Adjusted metformin dosage. Scheduled follow-up lab work. Continue current exercise regimen.",
    type: "note",
    severity: "normal",
  },
];

const severityBadge: Record<Report["severity"], string> = {
  normal: "bg-green-50 text-green-600 border-green-200",
  attention: "bg-amber-50 text-amber-600 border-amber-200",
  critical: "bg-red-50 text-red-500 border-red-200",
};

const severityLabel: Record<Report["severity"], string> = {
  normal: "Normal",
  attention: "Needs Attention",
  critical: "Critical",
};

export default function PatientReportSummary() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div>
          <h3 className="font-semibold text-[#0F172A]">Reports & Summaries</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            AI-summarised lab results and doctor notes
          </p>
        </div>
        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
          View all
        </span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {mockReports.map((report) => (
          <div
            key={report.id}
            className="px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
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
                    {report.date} • {report.type === "note" ? "Doctor Note" : "Lab Result"}
                  </p>
                  <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                    {report.summary}
                  </p>
                </div>
              </div>
              <button className="shrink-0 mt-1 p-2 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-primary transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

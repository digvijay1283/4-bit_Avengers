"use client";

import { useState } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

type Report = {
  id: string;
  title: string;
  type: "lab" | "imaging" | "prescription" | "other";
  date: string;
  status: "reviewed" | "pending" | "critical";
  summary: string;
};

const mockReports: Report[] = [
  {
    id: "1",
    title: "Complete Blood Count (CBC)",
    type: "lab",
    date: "Feb 19, 2026",
    status: "reviewed",
    summary: "All values within normal range. Hemoglobin 14.2 g/dL.",
  },
  {
    id: "2",
    title: "Lipid Panel",
    type: "lab",
    date: "Feb 15, 2026",
    status: "critical",
    summary: "LDL elevated at 165 mg/dL. HDL low at 38 mg/dL. Needs follow-up.",
  },
  {
    id: "3",
    title: "Chest X-Ray",
    type: "imaging",
    date: "Feb 10, 2026",
    status: "reviewed",
    summary: "No abnormalities detected. Lungs clear.",
  },
  {
    id: "4",
    title: "Thyroid Function Test",
    type: "lab",
    date: "Feb 8, 2026",
    status: "pending",
    summary: "Awaiting doctor review.",
  },
  {
    id: "5",
    title: "Vitamin D & B12 Panel",
    type: "lab",
    date: "Jan 28, 2026",
    status: "reviewed",
    summary: "Vitamin D slightly low at 22 ng/mL. B12 normal.",
  },
];

const statusConfig = {
  reviewed: {
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 border-green-200",
    label: "Reviewed",
  },
  pending: {
    icon: Clock,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    label: "Pending",
  },
  critical: {
    icon: AlertCircle,
    color: "bg-red-50 text-red-500 border-red-200",
    label: "Critical",
  },
};

const typeLabels: Record<Report["type"], string> = {
  lab: "Lab Work",
  imaging: "Imaging",
  prescription: "Rx",
  other: "Other",
};

export default function ReportsPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = mockReports.filter((r) => {
    const matchesSearch = r.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Medical Reports</h1>
          <p className="text-sm text-[#64748B] mt-1">
            View and manage your lab results, imaging, and prescriptions.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4D2A] transition shadow-sm"
        >
          <Upload className="h-4 w-4" />
          Upload Report
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search reports…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 py-2.5 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-[#D1FAE5]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "lab", "imaging", "prescription"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                filterType === type
                  ? "bg-primary text-white"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-primary hover:text-primary"
              }`}
            >
              {type === "all" ? "All" : typeLabels[type as Report["type"]]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: mockReports.length, color: "text-primary" },
          {
            label: "Pending Review",
            value: mockReports.filter((r) => r.status === "pending").length,
            color: "text-amber-600",
          },
          {
            label: "Critical",
            value: mockReports.filter((r) => r.status === "critical").length,
            color: "text-red-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Report List */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filtered.map((report) => {
              const s = statusConfig[report.status];
              const StatusIcon = s.icon;
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {report.title}
                        </p>
                        <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-[#F1F5F9] text-[#64748B]">
                          {typeLabels[report.type]}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">
                        {report.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-[#94A3B8] hidden sm:block">
                      {report.date}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${s.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {s.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#CBD5E1]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

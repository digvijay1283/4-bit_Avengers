"use client";

import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

type PatientRow = {
  name: string;
  lastVisit: string;
  risk: "low" | "medium" | "high";
  status: string;
};

const recentPatients: PatientRow[] = [
  {
    name: "Aisha Patel",
    lastVisit: "Today, 10:30 AM",
    risk: "low",
    status: "Follow-up done",
  },
  {
    name: "Rajesh Kumar",
    lastVisit: "Today, 09:15 AM",
    risk: "high",
    status: "Critical vitals",
  },
  {
    name: "Meera Shah",
    lastVisit: "Yesterday",
    risk: "medium",
    status: "Awaiting labs",
  },
  {
    name: "Karan Desai",
    lastVisit: "Feb 19, 2026",
    risk: "low",
    status: "Stable",
  },
  {
    name: "Sunita Reddy",
    lastVisit: "Feb 18, 2026",
    risk: "medium",
    status: "Meds adjusted",
  },
];

const riskBadge: Record<PatientRow["risk"], string> = {
  low: "bg-green-50 text-green-600",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-red-50 text-red-500",
};

const RiskIcon = ({ risk }: { risk: PatientRow["risk"] }) => {
  if (risk === "high") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (risk === "medium") return <Clock className="h-3.5 w-3.5" />;
  return <CheckCircle2 className="h-3.5 w-3.5" />;
};

export default function RecentPatientsTable() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A]">Recent Patients</h3>
        <span className="text-xs text-[#94A3B8]">
          {recentPatients.length} visits
        </span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {recentPatients.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-sm font-bold text-[#64748B]">
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">
                  {p.name}
                </p>
                <p className="text-xs text-[#94A3B8]">{p.lastVisit}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${riskBadge[p.risk]}`}
              >
                <RiskIcon risk={p.risk} />
                {p.risk}
              </span>
              <span className="hidden sm:inline text-xs text-[#64748B]">
                {p.status}
              </span>
              <ChevronRight className="h-4 w-4 text-[#CBD5E1]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

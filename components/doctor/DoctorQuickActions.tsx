"use client";

import {
  FileText,
  Heart,
  Footprints,
  Pill,
  Brain,
  TrendingUp,
  History,
  Shield,
} from "lucide-react";

const features = [
  {
    label: "Patient Reports",
    desc: "OCR-extracted lab results with AI summaries",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Vital Trends",
    desc: "Heart rate, BP, SpO₂, risk scores",
    icon: Heart,
    color: "bg-red-50 text-red-500",
  },
  {
    label: "Activity Log",
    desc: "Steps, calories, sleep tracking data",
    icon: Footprints,
    color: "bg-green-50 text-primary",
  },
  {
    label: "Medicine Adherence",
    desc: "Prescription compliance & missed doses",
    icon: Pill,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Mental Health",
    desc: "Mood & stress assessment trends",
    icon: Brain,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Risk Assessment",
    desc: "AI-powered health risk analysis",
    icon: TrendingUp,
    color: "bg-teal-50 text-teal-600",
  },
];

export default function DoctorQuickActions() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Patient Data Access
        </h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Available once a patient shares via QR code
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-4 hover:border-primary/30 hover:bg-soft-mint/10 transition-all text-center"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-[#0F172A]">
                {item.label}
              </p>
              <p className="text-[10px] text-[#94A3B8]">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Workflow hint */}
      <div className="mx-5 mb-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
        <div className="flex items-start gap-3">
          <History className="h-5 w-5 text-[#64748B] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#0F172A]">How it works</p>
            <ol className="text-[11px] text-[#64748B] mt-1 space-y-1 list-decimal list-inside">
              <li>Patient selects reports to share in their app</li>
              <li>Patient generates a time-limited QR code (30 min)</li>
              <li>You scan the QR or enter the Patient ID above</li>
              <li>View full patient health profile, vitals & AI summaries</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

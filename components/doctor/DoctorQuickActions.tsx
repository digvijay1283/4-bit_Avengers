"use client";

import {
  FileText,
  Heart,
  Footprints,
  Moon,
  Pill,
  Brain,
  TrendingUp,
} from "lucide-react";

const quickLinks = [
  {
    label: "Patient Reports",
    desc: "View uploaded lab results",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Vital Trends",
    desc: "Heart rate, BP & more",
    icon: Heart,
    color: "bg-red-50 text-red-500",
  },
  {
    label: "Activity Log",
    desc: "Steps, calories, sleep",
    icon: Footprints,
    color: "bg-green-50 text-primary",
  },
  {
    label: "Medicine Adherence",
    desc: "Prescription compliance",
    icon: Pill,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Mental Health",
    desc: "Mood & stress trends",
    icon: Brain,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Risk Assessment",
    desc: "AI-powered risk scores",
    icon: TrendingUp,
    color: "bg-teal-50 text-teal-600",
  },
];

export default function DoctorQuickActions() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A]">Quick Actions</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Patient data sections available after scanning
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-4 hover:border-primary/30 hover:bg-soft-mint/10 transition-all cursor-pointer text-center"
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
    </div>
  );
}

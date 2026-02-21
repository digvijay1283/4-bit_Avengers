"use client";

import {
  Heart,
  Thermometer,
  Droplets,
  Activity,
  Wind,
  Weight,
} from "lucide-react";

type VitalItem = {
  label: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  status: "normal" | "warning" | "critical";
};

const mockVitals: VitalItem[] = [
  {
    label: "Heart Rate",
    value: "78",
    unit: "bpm",
    icon: Heart,
    color: "bg-red-50 text-red-500",
    status: "normal",
  },
  {
    label: "Temperature",
    value: "98.6",
    unit: "°F",
    icon: Thermometer,
    color: "bg-orange-50 text-orange-500",
    status: "normal",
  },
  {
    label: "Blood Glucose",
    value: "142",
    unit: "mg/dL",
    icon: Droplets,
    color: "bg-blue-50 text-blue-500",
    status: "warning",
  },
  {
    label: "Blood Pressure",
    value: "130/85",
    unit: "mmHg",
    icon: Activity,
    color: "bg-purple-50 text-purple-500",
    status: "warning",
  },
  {
    label: "SpO₂",
    value: "97",
    unit: "%",
    icon: Wind,
    color: "bg-teal-50 text-teal-500",
    status: "normal",
  },
  {
    label: "BMI",
    value: "24.2",
    unit: "kg/m²",
    icon: Weight,
    color: "bg-green-50 text-primary",
    status: "normal",
  },
];

const statusBadge: Record<VitalItem["status"], string> = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function PatientVitalsPanel() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A]">Latest Vitals</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Last updated: Today, 10:30 AM
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
        {mockVitals.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.label}
              className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-4 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${v.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusBadge[v.status]}`}
                >
                  {v.status}
                </span>
              </div>
              <p className="text-xl font-bold text-[#0F172A]">
                {v.value}
                <span className="text-xs font-normal text-[#94A3B8] ml-1">
                  {v.unit}
                </span>
              </p>
              <p className="text-xs text-[#64748B] mt-1">{v.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

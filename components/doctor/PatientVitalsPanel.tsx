"use client";

import {
  Heart,
  Thermometer,
  Droplets,
  Activity,
  Wind,
  Weight,
  Footprints,
  Moon,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

type VitalItem = {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  status: "normal" | "warning" | "critical";
};

type Props = {
  vitals?: VitalItem[];
  lastUpdated?: string | null;
};

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Thermometer,
  Droplets,
  Activity,
  Wind,
  Weight,
  Footprints,
  Moon,
  ShieldAlert,
};

const statusBadge: Record<string, string> = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function PatientVitalsPanel({ vitals, lastUpdated }: Props) {
  const hasData = vitals && vitals.length > 0;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A]">Latest Vitals</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          {lastUpdated
            ? `Last updated: ${fmtDate(lastUpdated)}`
            : "No vitals data recorded yet"}
        </p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
            <Heart className="h-6 w-6 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#64748B]">
            No vitals available
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Vitals will appear once the patient records health data
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
          {vitals.map((v) => {
            const Icon = iconMap[v.icon] ?? HelpCircle;
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
                  {v.value !== "--" && (
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusBadge[v.status]}`}
                    >
                      {v.status}
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-[#0F172A]">
                  {v.value}
                  {v.unit && v.value !== "--" && (
                    <span className="text-xs font-normal text-[#94A3B8] ml-1">
                      {v.unit}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#64748B] mt-1">{v.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

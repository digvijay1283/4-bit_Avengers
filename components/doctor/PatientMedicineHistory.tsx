"use client";

import { Pill, Clock, CheckCircle2, XCircle } from "lucide-react";

type MedicineEntry = {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  status: "active" | "completed" | "discontinued";
  adherence: number; // percentage
};

const mockMedicines: MedicineEntry[] = [
  {
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: "Jan 5, 2026",
    status: "active",
    adherence: 92,
  },
  {
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily (night)",
    startDate: "Dec 20, 2025",
    status: "active",
    adherence: 88,
  },
  {
    name: "Vitamin D3",
    dosage: "60,000 IU",
    frequency: "Once weekly",
    startDate: "Nov 10, 2025",
    status: "active",
    adherence: 75,
  },
  {
    name: "Amoxicillin",
    dosage: "250mg",
    frequency: "Three times daily",
    startDate: "Feb 1, 2026",
    status: "completed",
    adherence: 100,
  },
  {
    name: "Omeprazole",
    dosage: "20mg",
    frequency: "Once daily (morning)",
    startDate: "Oct 5, 2025",
    status: "discontinued",
    adherence: 60,
  },
];

const statusConfig: Record<
  MedicineEntry["status"],
  { label: string; badge: string; icon: React.ElementType }
> = {
  active: {
    label: "Active",
    badge: "bg-green-50 text-green-600",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    badge: "bg-blue-50 text-blue-600",
    icon: Clock,
  },
  discontinued: {
    label: "Stopped",
    badge: "bg-red-50 text-red-500",
    icon: XCircle,
  },
};

function AdherenceBar({ value }: { value: number }) {
  const barColor =
    value >= 85
      ? "bg-green-500"
      : value >= 60
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[#64748B] w-8 text-right">
        {value}%
      </span>
    </div>
  );
}

export default function PatientMedicineHistory() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div>
          <h3 className="font-semibold text-[#0F172A]">Medicine History</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Current & past prescriptions with adherence tracking
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill className="h-4 w-4 text-primary" />
          <span className="text-xs text-primary font-medium">
            {mockMedicines.filter((m) => m.status === "active").length} active
          </span>
        </div>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {mockMedicines.map((med) => {
          const cfg = statusConfig[med.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={med.name}
              className="px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {med.name}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {med.dosage} • {med.frequency}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Started: {med.startDate}
                    </p>
                    <div className="mt-2 max-w-xs">
                      <AdherenceBar value={med.adherence} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Pill, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type MedicineEntry = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isActive: boolean;
  adherence: number;
  startDate: string;
  status: string;
  missedStreakCount: number;
  remainingQuantity: number;
  totalQuantity: number;
};

type Props = {
  medicines?: MedicineEntry[];
};

const statusConfig: Record<
  string,
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

export default function PatientMedicineHistory({ medicines }: Props) {
  const hasData = medicines && medicines.length > 0;
  const activeMeds = medicines?.filter((m) => m.isActive) ?? [];

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
          <h3 className="font-semibold text-[#0F172A]">Medicine History</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {hasData
              ? "Current & past prescriptions with adherence tracking"
              : "No prescriptions recorded yet"}
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-1.5">
            <Pill className="h-4 w-4 text-primary" />
            <span className="text-xs text-primary font-medium">
              {activeMeds.length} active
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
            <Pill className="h-6 w-6 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#64748B]">
            No medicines found
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Medicine data will appear once the patient adds prescriptions
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9]">
          {medicines.map((med) => {
            const cfg = statusConfig[med.status] ?? statusConfig.active;
            const StatusIcon = cfg.icon;
            const lowStock =
              med.isActive &&
              med.totalQuantity > 0 &&
              med.remainingQuantity / med.totalQuantity < 0.2;

            return (
              <div
                key={med.id}
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
                        {med.missedStreakCount >= 2 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            {med.missedStreakCount} missed
                          </span>
                        )}
                        {lowStock && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            Low stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {med.dosage} • {med.frequency}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Started: {fmtDate(med.startDate)}
                        {med.totalQuantity > 0 && (
                          <> • {med.remainingQuantity}/{med.totalQuantity} remaining</>
                        )}
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
      )}
    </div>
  );
}

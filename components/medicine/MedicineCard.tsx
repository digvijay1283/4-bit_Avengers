"use client";

import type { Medicine } from "@/types/medicine";
import { cn } from "@/lib/utils";

interface MedicineCardProps {
  medicine: Medicine;
}

const statusConfig: Record<
  Medicine["status"],
  { label: string; badgeClass: string; barColor: string }
> = {
  "due-soon": {
    label: "Due Soon",
    badgeClass: "bg-orange-100 text-orange-700 animate-pulse",
    barColor: "bg-orange-400",
  },
  missed: {
    label: "Missed",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    barColor: "bg-red-500",
  },
  taken: {
    label: "Taken",
    badgeClass: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
  },
  upcoming: {
    label: "Upcoming",
    badgeClass: "bg-slate-100 text-slate-600",
    barColor: "bg-gray-300",
  },
  snoozed: {
    label: "Snoozed",
    badgeClass: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-400",
  },
};

export default function MedicineCard({ medicine }: MedicineCardProps) {
  const config = statusConfig[medicine.status];
  const isMissed = medicine.status === "missed";
  const isUpcoming = medicine.status === "upcoming";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden group transition-shadow",
        isMissed
          ? "bg-red-50/50 border border-red-100"
          : "bg-white border border-gray-100 hover:shadow-md",
        isUpcoming && "opacity-75 hover:opacity-100"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1.5 h-full",
          config.barColor
        )}
      />

      {/* Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center",
            medicine.iconBg
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-3xl",
              medicine.iconColor
            )}
          >
            {medicine.icon}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {medicine.name}
            </h3>
            <p className="text-sm text-slate-500">{medicine.instruction}</p>
          </div>
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              config.badgeClass
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "material-symbols-outlined",
                isMissed ? "text-red-600" : "text-slate-400"
              )}
            >
              {isMissed ? "warning" : "schedule"}
            </span>
            <span className={cn(isMissed && "text-red-600 font-medium")}>
              {isMissed ? `Scheduled: ${medicine.time}` : medicine.time}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400">
              medication_liquid
            </span>
            <span>{medicine.dosage}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-center sm:w-32">
        {medicine.status === "due-soon" && (
          <>
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">check</span>
              Take Now
            </button>
            <button className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 font-medium text-center">
              Snooze 10m
            </button>
          </>
        )}
        {medicine.status === "missed" && (
          <>
            <button className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
              Mark Taken
            </button>
            <p className="mt-2 text-xs text-red-500 text-center cursor-pointer hover:underline">
              Log as skipped?
            </p>
          </>
        )}
        {medicine.status === "taken" && (
          <div className="w-full bg-green-50 text-green-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            Done
          </div>
        )}
        {medicine.status === "upcoming" && (
          <button className="w-full bg-slate-100 text-slate-400 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
            Wait
          </button>
        )}
      </div>
    </div>
  );
}

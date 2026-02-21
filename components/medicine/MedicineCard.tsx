"use client";

import type { Medicine } from "@/types/medicine";
import { cn } from "@/lib/utils";

interface MedicineCardProps {
  medicine: Medicine;
  onTake?: (medicineId: string, scheduledTime: string) => void;
  onSnooze?: (medicineId: string, scheduledTime: string) => void;
  onSkip?: (medicineId: string, scheduledTime: string) => void;
  onEdit?: (medicine: Medicine) => void;
}

const statusConfig: Record<
  Medicine["status"],
  { label: string; badgeClass: string; barColor: string; iconColor: string }
> = {
  "due-soon": {
    label: "Due Soon",
    badgeClass: "bg-orange-100 text-orange-700 animate-pulse",
    barColor: "bg-orange-400",
    iconColor: "text-orange-500",
  },
  missed: {
    label: "Missed",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    barColor: "bg-red-500",
    iconColor: "text-red-500",
  },
  taken: {
    label: "Taken",
    badgeClass: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
    iconColor: "text-green-500",
  },
  upcoming: {
    label: "Upcoming",
    badgeClass: "bg-slate-100 text-slate-600",
    barColor: "bg-gray-300",
    iconColor: "text-blue-500",
  },
  snoozed: {
    label: "Snoozed",
    badgeClass: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-400",
    iconColor: "text-blue-500",
  },
};

// Map medicine type to icon
function getMedicineIcon(type: string): string {
  switch (type) {
    case "supplement":
      return "wb_sunny";
    case "other":
      return "science";
    default:
      return "medication";
  }
}

export default function MedicineCard({
  medicine,
  onTake,
  onSnooze,
  onSkip,
  onEdit,
}: MedicineCardProps) {
  const config = statusConfig[medicine.status];
  const isMissed = medicine.status === "missed";
  const isUpcoming = medicine.status === "upcoming";
  const icon = getMedicineIcon(medicine.type);

  // Pick the nearest upcoming time to act on
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextTime =
    medicine.times.find((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m >= currentMinutes - 30;
    }) || medicine.times[0];

  const displayTime = medicine.times
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    })
    .join(", ");

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
        className={cn("absolute top-0 left-0 w-1.5 h-full", config.barColor)}
      />

      {/* Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center",
            isMissed
              ? "bg-red-50"
              : medicine.status === "taken"
              ? "bg-green-50"
              : "bg-slate-50"
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-3xl",
              config.iconColor
            )}
          >
            {icon}
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
            <p className="text-sm text-slate-500">
              {medicine.instruction || `${medicine.dosage} • ${medicine.frequency}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {medicine.frequency}
              </span>
              <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                {medicine.source}
              </span>
            </div>
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
              {displayTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400">
              medication_liquid
            </span>
            <span>{medicine.dosage}</span>
          </div>
          {medicine.remainingQuantity <= 5 && medicine.remainingQuantity > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <span className="material-symbols-outlined text-amber-500">
                inventory_2
              </span>
              <span className="font-medium">
                {medicine.remainingQuantity} left
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-center sm:w-36 sm:pl-2">
        {medicine.status === "due-soon" && (
          <>
            <button
              onClick={() => onTake?.(medicine._id, nextTime)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Take Now
            </button>
            <button
              onClick={() => onSnooze?.(medicine._id, nextTime)}
              className="mt-2 w-full text-xs text-slate-500 hover:text-slate-700 font-semibold text-center bg-slate-100 rounded-lg py-2"
            >
              Snooze 5m
            </button>
          </>
        )}
        {medicine.status === "snoozed" && (
          <>
            <button
              onClick={() => onTake?.(medicine._id, nextTime)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Take Now
            </button>
            <p className="mt-2 text-xs text-blue-500 text-center font-medium">
              Snoozed — will remind again
            </p>
          </>
        )}
        {medicine.status === "missed" && (
          <>
            <button
              onClick={() => onTake?.(medicine._id, nextTime)}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Mark Taken
            </button>
            <p
              onClick={() => onSkip?.(medicine._id, nextTime)}
              className="mt-2 text-xs text-red-500 text-center cursor-pointer hover:underline"
            >
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
          <>
            <button className="w-full bg-slate-100 text-slate-400 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
              Wait
            </button>
            <button
              onClick={() => onEdit?.(medicine)}
              className="mt-2 w-full text-xs text-slate-600 hover:text-slate-800 font-semibold text-center bg-slate-100 rounded-lg py-2"
            >
              Edit
            </button>
          </>
        )}
        {(medicine.status === "due-soon" || medicine.status === "snoozed" || medicine.status === "missed" || medicine.status === "taken") && (
          <button
            onClick={() => onEdit?.(medicine)}
            className="mt-2 w-full text-xs text-slate-600 hover:text-slate-800 font-semibold text-center bg-slate-100 rounded-lg py-2"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

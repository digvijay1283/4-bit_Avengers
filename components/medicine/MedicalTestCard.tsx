"use client";

import type { MedicalTest } from "@/types/medicine";
import { cn } from "@/lib/utils";

interface MedicalTestCardProps {
  test: MedicalTest;
}

const statusConfig: Record<
  MedicalTest["status"],
  { label: string; badgeClass: string; barColor: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-orange-100 text-orange-700",
    barColor: "bg-orange-400",
  },
  overdue: {
    label: "Overdue",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    barColor: "bg-red-500",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
  },
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-400",
  },
};

export default function MedicalTestCard({ test }: MedicalTestCardProps) {
  const config = statusConfig[test.status];
  const isOverdue = test.status === "overdue";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden group transition-shadow",
        isOverdue
          ? "bg-red-50/50 border border-red-100"
          : "bg-white border border-gray-100 hover:shadow-md"
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute top-0 left-0 w-1.5 h-full", config.barColor)} />

      {/* Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center",
            test.iconBg
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-3xl",
              test.iconColor
            )}
          >
            {test.icon}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{test.name}</h3>
            <p className="text-sm text-slate-500">{test.description}</p>
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
                isOverdue ? "text-red-600" : "text-slate-400"
              )}
            >
              {isOverdue ? "warning" : "calendar_month"}
            </span>
            <span className={cn(isOverdue && "text-red-600 font-medium")}>
              {test.scheduledDate}
              {test.scheduledTime ? ` • ${test.scheduledTime}` : ""}
            </span>
          </div>
          {test.location && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400">
                location_on
              </span>
              <span>{test.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-center sm:w-36">
        {test.status === "pending" && (
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">check</span>
            Mark Done
          </button>
        )}
        {test.status === "overdue" && (
          <>
            <button className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
              Reschedule
            </button>
            <p className="mt-2 text-xs text-red-500 text-center cursor-pointer hover:underline">
              Log as skipped?
            </p>
          </>
        )}
        {test.status === "completed" && (
          <div className="w-full bg-green-50 text-green-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            Done
          </div>
        )}
        {test.status === "scheduled" && (
          <button className="w-full bg-slate-100 text-slate-500 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-default">
            Upcoming
          </button>
        )}
      </div>
    </div>
  );
}

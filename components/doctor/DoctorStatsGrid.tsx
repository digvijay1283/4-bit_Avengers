"use client";

import {
  Users,
  CalendarCheck,
  ClipboardList,
  Activity,
} from "lucide-react";

const stats = [
  {
    label: "Total Patients",
    value: "248",
    change: "+12 this week",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Appointments Today",
    value: "14",
    change: "3 remaining",
    icon: CalendarCheck,
    color: "bg-green-50 text-primary",
  },
  {
    label: "Reports Reviewed",
    value: "32",
    change: "8 pending",
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Critical Alerts",
    value: "3",
    change: "Needs attention",
    icon: Activity,
    color: "bg-red-50 text-red-500",
  },
];

export default function DoctorStatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{stat.value}</p>
            <p className="text-sm font-medium text-[#64748B] mt-1">
              {stat.label}
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{stat.change}</p>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  Activity,
  Loader2,
} from "lucide-react";

type StatsData = {
  totalPatients: number;
  newPatientsThisWeek: number;
  activeSessions: number;
  todaySessions: number;
  totalReportsReviewed: number;
  pendingReports: number;
  criticalAlerts: number;
};

export default function DoctorStatsGrid() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/doctor/stats");
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch {
        /* silently fail — show zeros */
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      label: "Total Patients",
      value: stats?.totalPatients ?? 0,
      change: `+${stats?.newPatientsThisWeek ?? 0} this week`,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Today's Sessions",
      value: stats?.todaySessions ?? 0,
      change: `${stats?.activeSessions ?? 0} active now`,
      icon: CalendarCheck,
      color: "bg-green-50 text-primary",
    },
    {
      label: "Reports Reviewed",
      value: stats?.totalReportsReviewed ?? 0,
      change: `${stats?.pendingReports ?? 0} pending`,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Critical Alerts",
      value: stats?.criticalAlerts ?? 0,
      change: stats?.criticalAlerts ? "Needs attention" : "All clear",
      icon: Activity,
      color:
        (stats?.criticalAlerts ?? 0) > 0
          ? "bg-red-50 text-red-500"
          : "bg-green-50 text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat) => {
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
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-[#94A3B8]" />
              )}
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">
              {loading ? "—" : stat.value}
            </p>
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

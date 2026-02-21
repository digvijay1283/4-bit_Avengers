"use client";

import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Stethoscope,
  Users,
  ClipboardList,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";

const doctorStats = [
  {
    icon: Users,
    label: "Total Patients",
    value: "248",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ClipboardList,
    label: "Reports Reviewed",
    value: "1,024",
    color: "bg-green-50 text-primary",
  },
  {
    icon: Clock,
    label: "Avg. Consult Time",
    value: "18 min",
    color: "bg-amber-50 text-amber-600",
  },
];

const recentActivity = [
  { action: "Reviewed report for Aisha Patel", time: "10 min ago" },
  { action: "Scanned QR for Rajesh Kumar", time: "45 min ago" },
  { action: "Updated prescription for Meera Shah", time: "2 hours ago" },
  { action: "Completed consultation with Karan Desai", time: "3 hours ago" },
  { action: "Flagged critical alert for Sunita Reddy", time: "Yesterday" },
];

export default function DoctorProfileView() {
  const { user, logout } = useSession();

  const displayName = user?.fullName || user?.email?.split("@")[0] || "Doctor";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Doctor Profile
          </h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-primary hover:border-primary/30 transition">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
          {/* ── Left Column: Card + Info ───────────── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary to-[#34D399]" />
              <div className="px-6 pb-6 -mt-12 text-center">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-primary font-bold text-3xl border-4 border-white shadow-lg">
                  {initials}
                </div>
                <h2 className="mt-3 text-xl font-bold text-[#0F172A]">
                  {displayName}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-[#64748B]">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>Medical Professional</span>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 text-green-600 border border-green-200 px-3 py-1 text-xs font-semibold">
                  <Shield className="h-3 w-3" />
                  Verified Doctor
                </span>
              </div>
            </div>

            {/* Personal Info */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
              <h3 className="font-semibold text-[#0F172A] mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: user?.email ?? "—",
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: "+1 (555) 987-6543",
                  },
                  {
                    icon: Calendar,
                    label: "Member Since",
                    value: "Jan 2024",
                  },
                  {
                    icon: User,
                    label: "Role",
                    value: "Doctor",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right Column: Stats + Activity ─────── */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {doctorStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-[#64748B]">
                        {stat.label}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A]">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="border-b border-[#E2E8F0] px-5 py-4">
                <h3 className="font-semibold text-[#0F172A]">
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <p className="text-sm text-[#0F172A]">{item.action}</p>
                    </div>
                    <span className="text-xs text-[#94A3B8] shrink-0 ml-4">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Settings */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
              <h3 className="font-semibold text-[#0F172A] mb-4">
                Quick Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Notification Preferences", desc: "Manage alerts & reminders" },
                  { label: "Privacy Settings", desc: "Data sharing & visibility" },
                  { label: "Account Security", desc: "Password & 2FA settings" },
                  { label: "Export Data", desc: "Download your activity logs" },
                ].map((setting) => (
                  <button
                    key={setting.label}
                    className="flex flex-col items-start rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-4 hover:border-primary/30 hover:bg-soft-mint/10 transition-all text-left"
                  >
                    <p className="text-sm font-medium text-[#0F172A]">
                      {setting.label}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {setting.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

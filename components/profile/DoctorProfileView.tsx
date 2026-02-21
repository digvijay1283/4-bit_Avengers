"use client";

import { useState, FormEvent } from "react";
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
  Pencil,
  Save,
  X,
  Loader2,
  Hash,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import {
  useProfile,
  getInitials,
  formatDate,
  type UserProfile,
} from "@/hooks/useProfile";

/* ── Editable fields for doctor edit modal ──────────────────────────── */
const DOCTOR_EDITABLE_FIELDS: {
  key: keyof UserProfile;
  label: string;
  type?: string;
  placeholder?: string;
}[] = [
  { key: "fullName", label: "Full Name", placeholder: "Dr. Jane Smith" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+1 555-987-6543" },
  { key: "specialization", label: "Specialization", placeholder: "Cardiology" },
  { key: "licenseNumber", label: "License Number", placeholder: "MD-123456" },
  { key: "gender", label: "Gender", placeholder: "Male / Female / Other" },
  { key: "address", label: "Clinic Address", placeholder: "123 Medical Blvd" },
];

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
  const { logout } = useSession();
  const { profile, status, updateProfile, refresh } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Loading state
  if (status === "loading" || !profile) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading profile…</p>
        </div>
      </main>
    );
  }

  const displayName = profile.fullName || profile.email.split("@")[0];
  const initials = getInitials(displayName);
  const memberSince = formatDate(profile.createdAt);

  /* ── Contact info from real data ──────────────────────────────── */
  const contactItems = [
    {
      icon: Mail,
      label: "Email",
      value: profile.email,
    },
    {
      icon: Phone,
      label: "Phone",
      value: profile.phone || "Not set",
    },
    {
      icon: Stethoscope,
      label: "Specialization",
      value: profile.specialization || "General",
    },
    {
      icon: Hash,
      label: "License No.",
      value: profile.licenseNumber || "Not set",
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: memberSince,
    },
    {
      icon: User,
      label: "Role",
      value: "Doctor",
    },
  ];

  /* ── Save handler ─────────────────────────────────────────────── */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const fd = new FormData(e.currentTarget);
    const updates: Record<string, string | null> = {};
    for (const { key } of DOCTOR_EDITABLE_FIELDS) {
      const val = fd.get(key);
      if (val !== null) updates[key] = String(val).trim() || null;
    }

    const result = await updateProfile(updates as Partial<UserProfile>);
    if (result.ok) {
      setSaveMsg("Profile updated!");
      setEditing(false);
      refresh();
    } else {
      setSaveMsg(result.message);
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Doctor Profile
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
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
                  <span>{profile.specialization || "Medical Professional"}</span>
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
                {contactItems.map((item) => {
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

      {/* Toast */}
      {saveMsg && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-emerald-200 text-emerald-700 rounded-xl px-5 py-3 shadow-lg text-sm font-medium">
          {saveMsg}
        </div>
      )}

      {/* ── Edit Profile Modal ───────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">
                Edit Profile
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Fields */}
            <div className="px-6 py-5 space-y-4">
              {DOCTOR_EDITABLE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    name={field.key}
                    type={field.type ?? "text"}
                    defaultValue={(profile[field.key] as string) ?? ""}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition"
                  />
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

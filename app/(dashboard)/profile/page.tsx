"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { Bell, Save, X, Pencil, Loader2 } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import PersonalInfo from "@/components/profile/PersonalInfo";
import HealthStatsRow from "@/components/profile/HealthStatsRow";
import DoctorProfileView from "@/components/profile/DoctorProfileView";
import { useSession } from "@/hooks/useSession";
import {
  useProfile,
  getAge,
  getInitials,
  formatDate,
  type UserProfile,
} from "@/hooks/useProfile";

/* ── Editable fields for the user edit modal ───────────────────────── */
const EDITABLE_FIELDS: {
  key: keyof UserProfile;
  label: string;
  type?: string;
  placeholder?: string;
}[] = [
  { key: "fullName", label: "Full Name", placeholder: "John Doe" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+1 555-012-3456" },
  { key: "gender", label: "Gender", placeholder: "Male / Female / Other" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
  { key: "address", label: "Address", placeholder: "2464 Royal Ln. Mesa" },
  { key: "bloodType", label: "Blood Type", placeholder: "O+" },
  { key: "weight", label: "Weight", placeholder: "75kg" },
  { key: "height", label: "Height", placeholder: "182cm" },
  {
    key: "emergencyContactName",
    label: "Emergency Contact Name",
    placeholder: "Jane Doe",
  },
  {
    key: "emergencyContactPhone",
    label: "Emergency Contact Phone",
    type: "tel",
    placeholder: "+1 555-987-6543",
  },
];

/* ── Page Component ─────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useSession();
  const { profile, status, updateProfile, refresh } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const role = user?.role ?? "user";

  // Doctor gets a doctor-specific profile view
  if (role === "doctor") {
    return <DoctorProfileView />;
  }

  // Loading skeleton
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
  const age = getAge(profile.dateOfBirth);
  const ageDisplay = age === null ? "-" : String(age);
  const memberSince = formatDate(profile.createdAt);

  /* ── Build info items from real data ──────────────────────────── */
  const personalInfoItems = [
    {
      icon: "person",
      label: "Gender",
      value: profile.gender || "-",
    },
    { icon: "mail", label: "Email", value: profile.email },
    {
      icon: "call",
      label: "Phone",
      value: profile.phone || "-",
    },
    {
      icon: "home",
      label: "Address",
      value: profile.address || "-",
    },
    {
      icon: "bloodtype",
      label: "Blood Type",
      value: profile.bloodType || "-",
    },
    {
      icon: "emergency",
      label: "Emergency Contact",
      value: profile.emergencyContactName
        ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || "—"})`
        : "-",
    },
  ];

  const healthStats = [
    {
      icon: "ecg_heart",
      iconBg: "",
      iconColor: "",
      label: "Health Score",
      value: 88,
      suffix: "/100",
      hero: true,
      heroBadge: "Excellent",
    },
    {
      icon: "medication",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      label: "Active Meds",
      value: 3,
      suffix: "daily",
    },
    {
      icon: "medical_services",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      label: "Consultations",
      value: 12,
      suffix: "total",
    },
  ];

  /* ── Save handler ─────────────────────────────────────────────── */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const fd = new FormData(e.currentTarget);
    const updates: Record<string, string | null> = {};
    for (const { key } of EDITABLE_FIELDS) {
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
            Profile Dashboard
          </h1>

          <div className="flex items-center gap-4">
            {/* Edit button */}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>

            {/* Notifications */}
            <button className="bg-white p-2 rounded-full text-slate-500 hover:text-primary shadow-sm relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-full shadow-sm pr-4">
              {profile.avatarUrl ? (
                <Image
                  alt={displayName}
                  src={profile.avatarUrl}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
              <span className="text-sm font-bold text-slate-700 hidden sm:block">
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      {saveMsg && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-emerald-200 text-emerald-700 rounded-xl px-5 py-3 shadow-lg text-sm font-medium">
          {saveMsg}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-light">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
          {/* ── Left Column (3 cols) ───────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ProfileCard
              name={displayName}
              avatarUrl={profile.avatarUrl || ""}
              isPremium
              weight={profile.weight || "-"}
              height={profile.height || "-"}
              age={ageDisplay}
            />
            <PersonalInfo items={personalInfoItems} onEdit={() => setEditing(true)} />
          </div>

          {/* ── Center Column (6 cols) ─────────────────────── */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <HealthStatsRow stats={healthStats} />

            {/* Member info card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">
                Account Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-medium">
                    Member Since
                  </p>
                  <p className="font-semibold text-slate-900">{memberSince}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">Status</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {profile.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">User ID</p>
                  <p className="font-mono text-xs text-slate-600 truncate">
                    {profile.userId}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">
                    Last Updated
                  </p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column (3 cols) ──────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Quick Links */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: "upload_file",
                    label: "Upload Report",
                    href: "/upload",
                  },
                  {
                    icon: "medication",
                    label: "Medi Reminder",
                    href: "/medi-reminder",
                  },
                  {
                    icon: "psychology",
                    label: "Mental Health",
                    href: "/mental-health",
                  },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-soft-mint/20 transition group"
                  >
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                      {action.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {action.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {EDITABLE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    name={field.key}
                    type={field.type ?? "text"}
                    defaultValue={
                      field.type === "date" && profile.dateOfBirth
                        ? profile.dateOfBirth.split("T")[0]
                        : (profile[field.key] as string) ?? ""
                    }
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

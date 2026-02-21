"use client";

import Image from "next/image";
import { Bell } from "lucide-react";
import ProfileCard from "@/components/profile/ProfileCard";
import PersonalInfo from "@/components/profile/PersonalInfo";
import HealthStatsRow from "@/components/profile/HealthStatsRow";
import DailyRoutine from "@/components/profile/DailyRoutine";
import UpcomingAppointments from "@/components/profile/UpcomingAppointments";
import QuickBook from "@/components/profile/QuickBook";
import type { RoutineItem } from "@/components/profile/DailyRoutine";
import type { Appointment } from "@/components/profile/UpcomingAppointments";
import type { TimeSlot } from "@/components/profile/QuickBook";

/* ── Mock Data ──────────────────────────────────────────────── */

const AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCH_oRGbsQNhiLAOFF_XwVIWhUOj6RbsAUana6CXFjfRnUYR7vzTvhcEkdkhQES7RTfar0kWqZ32rBCX2pgpzlUz_Hle4BPXa1st_Szcy0l1AKaq-BOi7Q_zSuc2ZO_1beiMV78dpDjjLQNj2_PK7AgEro1RFJ_ImNrsn3vRr0WCyomt3-bMHFiqBgjr5jfaHyqfpwAEssUSTe0oDJr29zlmtxTbtanbf0FXFRVPqd5xcaDlFVW6ckFxtSlDgLqdQeLlBZILgm0CNQO";

const personalInfoItems = [
  { icon: "person", label: "Gender", value: "Male" },
  { icon: "mail", label: "Email", value: "alex.j@vitalai.com" },
  { icon: "call", label: "Phone", value: "+1 (555) 012-3456" },
  { icon: "home", label: "Address", value: "2464 Royal Ln. Mesa" },
  { icon: "bloodtype", label: "Blood Type", value: "O+" },
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

const routineItems: RoutineItem[] = [
  {
    time: "08:00 AM",
    title: "Morning Vitals Check",
    description: "Blood Pressure, Heart Rate",
    status: "done",
  },
  {
    time: "09:30 AM",
    title: "Medicine: Vitamin D",
    description: "1 Tablet, after breakfast",
    status: "pending",
  },
  {
    time: "05:00 PM",
    title: "Afternoon Walk",
    description: "Target: 30 minutes",
    status: "upcoming",
  },
];

const appointments: Appointment[] = [
  {
    doctorName: "Dr. Sarah J.",
    specialty: "Cardiologist",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBY2P47bYfNCnwgAKMVJsQzWG_qL9J_ht8EYQZpehDR38u5_VLEAk83Ssc_vaElU7cC-KL3dFJP4lprAHpTgWKoBQ2rn2InmGPYQP-3MIIuBoVNHyL57RSUFVzsWW8FmuHhRNA3sqsbqER_KaLyKOeZF7beoojCKWEh660mbK5927nPsYo63uvleZ62aplE4PVGQ78eXs7tOJt8UlnHnnMxdYCCWUGV5uGdfkkaubn4I_WF65qCPa72b0c12GDbEjvJkBkXsbsNAWNL",
    date: "Oct 24",
    time: "09:00 AM",
    highlighted: true,
  },
  {
    doctorName: "Dr. Mark Chen",
    specialty: "Neurologist",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXULu1dDQAkx9YP9E7VZUtu7h1hAVYTAs3nE5gefv60sxWPfBaLeDenaqMWgtcQW04Yqca6xiUPhTSo0rOtVPn98DCq3wjVjZfVypcex-Pw4u72WEz2kyG--odTQpTpt0ijD5LimywUxTbwD9rsDauuUjoqZhiSO6IURoSc0UJs1EIWW1AczBUC7LYkvvzCph_G3zXiyiJUwrvh6McQT99iMszzkvFVn1zeI8Ctxqt7lLuxoCLxDT_A5o7oX4dWx3ebuOTzl5VvpU_",
    date: "Oct 28",
    time: "02:30 PM",
    highlighted: false,
  },
];

const timeSlots: TimeSlot[] = [
  { time: "09:00 AM", available: false },
  { time: "09:30 AM", available: false },
  { time: "10:00 AM", available: true, highlighted: true },
  { time: "10:30 AM", available: true, highlighted: true },
  { time: "11:00 AM", available: true },
  { time: "11:30 AM", available: true },
];

/* ── Page Component ─────────────────────────────────────────── */

export default function ProfilePage() {
  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Profile Dashboard
          </h1>

          <div className="flex items-center gap-4">
            {/* Search (desktop) */}
            <div className="relative hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-lg">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 rounded-full bg-white border-none text-sm w-64 focus:ring-2 focus:ring-primary/20 shadow-sm"
                placeholder="Search..."
                type="text"
              />
            </div>

            {/* Notifications */}
            <button className="bg-white p-2 rounded-full text-slate-500 hover:text-primary shadow-sm relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-full shadow-sm pr-4">
              <Image
                alt="User"
                src={AVATAR_URL}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-bold text-slate-700 hidden sm:block">
                Alex J.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
          {/* ── Left Column (3 cols) ────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ProfileCard
              name="Alex Johnson"
              avatarUrl={AVATAR_URL}
              isPremium
              weight="75kg"
              height="182cm"
              age={28}
            />
            <PersonalInfo items={personalInfoItems} />
          </div>

          {/* ── Center Column (6 cols) ──────────────────────── */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <HealthStatsRow stats={healthStats} />
            <DailyRoutine items={routineItems} />
          </div>

          {/* ── Right Column (3 cols) ───────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <UpcomingAppointments appointments={appointments} />
            <QuickBook doctorName="Dr. Sarah J." slots={timeSlots} />
          </div>
        </div>
      </div>
    </main>
  );
}

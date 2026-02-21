"use client";

import { useState } from "react";
import MainTabSwitcher from "@/components/medicine/MainTabSwitcher";
import SubTabBar from "@/components/medicine/SubTabBar";
import MedicineCard from "@/components/medicine/MedicineCard";
import MedicalTestCard from "@/components/medicine/MedicalTestCard";
import AudioAlertToggle from "@/components/medicine/AudioAlertToggle";
import DailyProgressWidget from "@/components/medicine/DailyProgressWidget";
import LowStockAlert from "@/components/medicine/LowStockAlert";
import AddMedicineFAB from "@/components/medicine/AddMedicineFAB";
import type { Medicine, MedicalTest } from "@/types/medicine";
import Image from "next/image";
import { Bell } from "lucide-react";

/* ── Mock data (medicines) ──────────────────────────────────── */
const medicines: Medicine[] = [
  {
    id: "1",
    name: "Vitamin D Complex",
    dosage: "500mg",
    frequency: "Daily",
    instruction: "1 Tablet • After Breakfast",
    time: "09:00 AM",
    icon: "wb_sunny",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    status: "due-soon",
    accentColor: "orange",
  },
  {
    id: "2",
    name: "Metformin",
    dosage: "850mg",
    frequency: "Daily",
    instruction: "1 Tablet • Before Breakfast",
    time: "08:00 AM",
    icon: "bloodtype",
    iconColor: "text-red-500",
    iconBg: "bg-white border border-red-100 shadow-sm",
    status: "missed",
    accentColor: "red",
  },
  {
    id: "3",
    name: "Omega-3 Fish Oil",
    dosage: "1000mg",
    frequency: "Daily",
    instruction: "1 Capsule • With Lunch",
    time: "01:00 PM",
    icon: "water_drop",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    status: "upcoming",
    accentColor: "blue",
  },
];

/* ── Mock data (medical tests) ──────────────────────────────── */
const medicalTests: MedicalTest[] = [
  {
    id: "t1",
    name: "Complete Blood Count (CBC)",
    description: "Routine blood panel — fasting required",
    scheduledDate: "Feb 24, 2026",
    scheduledTime: "10:30 AM",
    location: "City Diagnostics Lab",
    icon: "science",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    status: "pending",
    accentColor: "purple",
  },
  {
    id: "t2",
    name: "HbA1c (Diabetes Monitor)",
    description: "3-month blood sugar average",
    scheduledDate: "Feb 18, 2026",
    scheduledTime: "09:00 AM",
    location: "HealthFirst Clinic",
    icon: "monitor_heart",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    status: "overdue",
    accentColor: "red",
  },
  {
    id: "t3",
    name: "Thyroid Panel (TSH, T3, T4)",
    description: "Comprehensive thyroid function",
    scheduledDate: "Mar 5, 2026",
    scheduledTime: "11:00 AM",
    location: "Metro Hospital",
    icon: "biotech",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    status: "scheduled",
    accentColor: "blue",
  },
];

export default function MediReminderPage() {
  const [mainTab, setMainTab] = useState<"medicines" | "tests">("medicines");
  const [subTab, setSubTab] = useState<"daily" | "inventory" | "history">(
    "daily"
  );

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Medi Reminder
            </h1>
            <p className="text-sm text-slate-500">
              Manage your daily medications and tests
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Alex Johnson</p>
                <p className="text-xs text-slate-500">Premium Member</p>
              </div>
              <Image
                alt="User profile picture"
                className="w-10 h-10 object-cover rounded-full border-2 border-[#D1FAE5]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH_oRGbsQNhiLAOFF_XwVIWhUOj6RbsAUana6CXFjfRnUYR7vzTvhcEkdkhQES7RTfar0kWqZ32rBCX2pgpzlUz_Hle4BPXa1st_Szcy0l1AKaq-BOi7Q_zSuc2ZO_1beiMV78dpDjjLQNj2_PK7AgEro1RFJ_ImNrsn3vRr0WCyomt3-bMHFiqBgjr5jfaHyqfpwAEssUSTe0oDJr29zlmtxTbtanbf0FXFRVPqd5xcaDlFVW6ckFxtSlDgLqdQeLlBZILgm0CNQO"
                width={40}
                height={40}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left — Main content */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Main tab switcher: Medicines / Medical Tests */}
            <MainTabSwitcher activeTab={mainTab} onTabChange={setMainTab} />

            {/* Sub-tab bar */}
            <SubTabBar activeTab={subTab} onTabChange={setSubTab} />

            {/* Cards list */}
            <div className="grid grid-cols-1 gap-6">
              {mainTab === "medicines"
                ? medicines.map((med) => (
                    <MedicineCard key={med.id} medicine={med} />
                  ))
                : medicalTests.map((test) => (
                    <MedicalTestCard key={test.id} test={test} />
                  ))}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-6">
            <AudioAlertToggle />
            <DailyProgressWidget />
            <LowStockAlert />
          </aside>
        </div>
      </div>

      {/* FAB — scan prescription via OCR */}
      <AddMedicineFAB userId="demo-user" />
    </main>
  );
}

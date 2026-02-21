import type { Metadata } from "next";
import DoctorHero from "@/components/doctor/DoctorHero";
import DoctorStatsGrid from "@/components/doctor/DoctorStatsGrid";
import QRScannerCard from "@/components/doctor/QRScannerCard";
import RecentPatientsTable from "@/components/doctor/RecentPatientsTable";
import DoctorQuickActions from "@/components/doctor/DoctorQuickActions";

export const metadata: Metadata = {
  title: "Doctor Console | VitalAI",
};

export default function DoctorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <DoctorHero />

      {/* Stats */}
      <div className="mt-6">
        <DoctorStatsGrid />
      </div>

      {/* Main content: QR Scanner (left) + Recent Patients (right) */}
      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        <main className="w-full lg:w-2/5 flex flex-col gap-6">
          <QRScannerCard />
          <DoctorQuickActions />
        </main>

        <aside className="w-full lg:w-3/5">
          <RecentPatientsTable />
        </aside>
      </div>
    </div>
  );
}

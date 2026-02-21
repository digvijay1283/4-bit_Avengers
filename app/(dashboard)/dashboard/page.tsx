import type { Metadata } from "next";
import HeroSection from "@/components/dashboard/HeroSection";
import MissionSection from "@/components/dashboard/MissionSection";
import SpecialistGrid from "@/components/dashboard/SpecialistGrid";
import LiveMonitoring from "@/components/dashboard/LiveMonitoring";
import WeeklyTrendChart from "@/components/dashboard/WeeklyTrendChart";
import ProfileSnippet from "@/components/dashboard/ProfileSnippet";
import RemindersWidget from "@/components/dashboard/RemindersWidget";
import DailyInsight from "@/components/dashboard/DailyInsight";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area (Left 75% on Desktop) */}
        <main className="w-full lg:w-3/4 flex flex-col gap-8">
          <HeroSection />
          <MissionSection />
          <SpecialistGrid />
          <LiveMonitoring />
          <WeeklyTrendChart />
        </main>

        {/* Sidebar (Right 25% on Desktop, Sticky) */}
        <aside className="w-full lg:w-1/4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
          <ProfileSnippet />
          <RemindersWidget />
          <DailyInsight />
        </aside>
      </div>
    </div>
  );
}

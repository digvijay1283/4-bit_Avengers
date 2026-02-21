import type { Metadata } from "next";
import HeroSection from "@/components/dashboard/HeroSection";
import LiveMonitoring from "@/components/dashboard/LiveMonitoring";
import ProfileSnippet from "@/components/dashboard/ProfileSnippet";
import ChatDashboardModal from "@/components/chat/ChatDashboardModal";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:w-3/4 flex flex-col gap-8">
            <HeroSection />
            <LiveMonitoring />
          </main>

          <aside className="w-full lg:w-1/4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
            <ProfileSnippet />
          </aside>
        </div>
      </div>
      <ChatDashboardModal />
    </>
  );
}

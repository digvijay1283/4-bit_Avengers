import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#122018] text-slate-800 dark:text-slate-100">
      <Header />
      {children}
      <MobileNav />
    </div>
  );
}

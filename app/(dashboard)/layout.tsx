import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { requireAuth } from "@/lib/rbac";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#122018] text-slate-800 dark:text-slate-100">
      <Header />
      {children}
      <MobileNav />
    </div>
  );
}

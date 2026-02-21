"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  FileText,
  User,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";

const bottomNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dash", href: "/dashboard", icon: LayoutDashboard },
  { label: "Report", href: "/reports", icon: FileText },
  { label: "Profile", href: "/profile", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const role = user?.role ?? "user";

  const centerLink = role === "doctor" ? "/doctor" : "/medi-reminder";
  const CenterIcon = role === "doctor" ? Stethoscope : Pill;

  return (
    <>
      {/* Bottom Navigation — visible on mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-gray-700 pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-between items-end pb-3">
          {bottomNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive
                    ? "text-primary"
                    : "text-slate-400 hover:text-primary transition-colors"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Center FAB — role-aware */}
          <Link
            href={centerLink}
            className="-mt-8 bg-primary rounded-full p-3 shadow-lg border-4 border-white"
          >
            <CenterIcon className="h-5 w-5 text-white" />
          </Link>

          {bottomNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive
                    ? "text-primary"
                    : "text-slate-400 hover:text-primary transition-colors"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for bottom nav on mobile */}
      <div className="h-20 md:hidden" />
    </>
  );
}

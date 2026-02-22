"use client";

import Link from "next/link";
import { APP_NAME, getNavItemsByRole, getHomeRouteForRole, ROUTES } from "@/constants";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { useMemo } from "react";
import { useSession } from "@/hooks/useSession";

export default function Header() {
  const pathname = usePathname();
  const { user, status, logout } = useSession();
  const role = user?.role ?? "user";
  const sessionReady = status !== "loading";

  const navItems = useMemo(() => getNavItemsByRole(role), [role]);
  const homeRoute = useMemo(() => getHomeRouteForRole(role), [role]);

  function isActive(href: string) {
    if (href === pathname) return true;
    // Nested routes: /doctor/patient/xxx should match /doctor
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    return false;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={homeRoute} className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav — only render once session role is resolved */}
        <nav className="hidden md:flex gap-8">
          {sessionReady &&
            navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "text-primary font-bold text-sm"
                    : "text-slate-600 hover:text-primary font-semibold text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
        </nav>

        {/* CTA */}
        {user ? (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
          >
            Logout
          </button>
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

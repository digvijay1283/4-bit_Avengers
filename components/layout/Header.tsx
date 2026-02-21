"use client";

import Link from "next/link";
import { APP_NAME, NAV_ITEMS, ROUTES } from "@/constants";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-[#122018]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "text-primary font-bold text-sm"
                  : "text-slate-600 hover:text-primary font-semibold text-sm transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md">
          Try for free
        </button>
      </div>
    </header>
  );
}

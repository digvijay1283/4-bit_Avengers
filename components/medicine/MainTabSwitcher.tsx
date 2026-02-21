"use client";

import { cn } from "@/lib/utils";

interface MainTabSwitcherProps {
  activeTab: "medicines" | "tests";
  onTabChange: (tab: "medicines" | "tests") => void;
}

export default function MainTabSwitcher({
  activeTab,
  onTabChange,
}: MainTabSwitcherProps) {
  return (
    <div className="bg-white p-1 rounded-xl inline-flex shadow-sm border border-gray-100 w-full sm:w-auto self-start">
      <button
        onClick={() => onTabChange("medicines")}
        className={cn(
          "flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-sm transition-all",
          activeTab === "medicines"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50 font-semibold"
        )}
      >
        Medicines
      </button>
      <button
        onClick={() => onTabChange("tests")}
        className={cn(
          "flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-sm transition-all",
          activeTab === "tests"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50 font-semibold"
        )}
      >
        Medical Tests
      </button>
    </div>
  );
}

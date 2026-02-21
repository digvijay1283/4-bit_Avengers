"use client";

import { cn } from "@/lib/utils";

type SubTab = "daily" | "inventory" | "history";

interface SubTabBarProps {
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
}

const tabs: { key: SubTab; label: string }[] = [
  { key: "daily", label: "Daily Schedule" },
  { key: "inventory", label: "Inventory" },
  { key: "history", label: "History" },
];

export default function SubTabBar({ activeTab, onTabChange }: SubTabBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex gap-6 border-b border-gray-200 w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "pb-2 border-b-2 text-sm transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 font-medium"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
        <span className="material-symbols-outlined text-lg">
          calendar_month
        </span>
        <span>
          Today,{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

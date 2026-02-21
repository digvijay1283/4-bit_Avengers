"use client";

export type RoutineStatus = "done" | "pending" | "upcoming";

export interface RoutineItem {
  time: string;
  title: string;
  description: string;
  status: RoutineStatus;
}

const statusConfig: Record<
  RoutineStatus,
  { dotBg: string; dotIcon: string; badgeBg: string; badgeText: string; label: string; opacity?: string }
> = {
  done: {
    dotBg: "bg-green-100 text-green-600",
    dotIcon: "check",
    badgeBg: "bg-green-100 text-green-700 border-green-200",
    badgeText: "Done",
    label: "Done",
  },
  pending: {
    dotBg: "bg-white text-slate-400",
    dotIcon: "schedule",
    badgeBg: "bg-orange-100 text-orange-700 border-orange-200",
    badgeText: "Pending",
    label: "Pending",
  },
  upcoming: {
    dotBg: "bg-white text-slate-400",
    dotIcon: "schedule",
    badgeBg: "bg-slate-100 text-slate-500 border-slate-200",
    badgeText: "Upcoming",
    label: "Upcoming",
    opacity: "opacity-70",
  },
};

interface DailyRoutineProps {
  items: RoutineItem[];
}

export default function DailyRoutine({ items }: DailyRoutineProps) {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 flex-1 border border-gray-200 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-slate-900">Daily Routine</h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200 z-0" />

        {items.map((item) => {
          const cfg = statusConfig[item.status];
          return (
            <div
              key={item.time + item.title}
              className="relative z-10 grid grid-cols-[auto_1fr] gap-4"
            >
              {/* Dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${cfg.dotBg}`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {cfg.dotIcon}
                  </span>
                </div>
              </div>

              {/* Card */}
              <div
                className={`glass-card bg-white/60 p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-white transition-colors ${cfg.opacity ?? ""}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {item.time}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.description}</p>

                {/* Action buttons for pending items */}
                {item.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                      Confirm
                    </button>
                    <button className="bg-white border border-gray-200 text-slate-500 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Snooze
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

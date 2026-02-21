import type { DailyProgress } from "@/types/medicine";

interface DailyProgressWidgetProps {
  progress?: DailyProgress;
}

export default function DailyProgressWidget({
  progress = { taken: 3, missed: 1, pending: 1, total: 5 },
}: DailyProgressWidgetProps) {
  const percent = Math.round((progress.taken / progress.total) * 100);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 text-slate-900">Daily Progress</h3>

      {/* Circular Progress */}
      <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#106534"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{percent}%</span>
          <span className="text-xs text-slate-400 font-semibold uppercase">
            Done
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-slate-600">Taken</span>
          </div>
          <span className="font-bold text-slate-900">
            {progress.taken}/{progress.total}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-slate-600">Missed</span>
          </div>
          <span className="font-bold text-slate-900">{progress.missed}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-sm font-medium text-slate-600">Pending</span>
          </div>
          <span className="font-bold text-slate-900">{progress.pending}</span>
        </div>
      </div>

      <button className="w-full mt-6 py-3 border border-gray-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
        View Full Report
      </button>
    </div>
  );
}

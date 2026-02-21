import Card from "@/components/ui/Card";

interface SleepCardProps {
  sleepHours?: number;
  loading?: boolean;
}

export default function SleepCard({ sleepHours, loading }: SleepCardProps) {
  const value = sleepHours ?? 0;
  const hasData = value > 0;

  // Format hours to "Xh Ym"
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  const formatted = hasData ? `${hours}h ${minutes}m` : "—";

  // Sleep quality rating
  const quality =
    value >= 7
      ? { label: "Good sleep", color: "text-green-600" }
      : value >= 5
        ? { label: "Moderate sleep", color: "text-orange-600" }
        : value > 0
          ? { label: "Poor sleep", color: "text-red-600" }
          : { label: "No data available", color: "text-slate-400" };

  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-indigo-500 shadow-sm">
          <span className="material-symbols-outlined">bedtime</span>
        </div>
        <span className="text-slate-400 text-xs">Last Night</span>
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-9 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatted}
          </span>
        )}
      </div>
      <p className={`text-xs mt-1 font-medium ${quality.color}`}>
        {loading ? "Fetching sleep data…" : quality.label}
      </p>
    </Card>
  );
}

import Card from "@/components/ui/Card";

interface StepsCardProps {
  steps?: number;
  goal?: number;
  loading?: boolean;
}

export default function StepsCard({
  steps,
  goal = 10000,
  loading,
}: StepsCardProps) {
  const value = steps ?? 0;
  const hasData = value > 0;
  const percent = Math.min((value / goal) * 100, 100);

  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-orange-500 shadow-sm">
          <span className="material-symbols-outlined">footprint</span>
        </div>
        <span className="text-slate-400 text-xs">Today</span>
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {hasData ? value.toLocaleString() : "—"}
            </span>
            <span className="text-sm text-slate-500 ml-1">steps</span>
          </>
        )}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1 mt-3 dark:bg-gray-700">
        <div
          className="bg-orange-400 h-1 rounded-full transition-all duration-500"
          style={{ width: loading ? "0%" : `${percent}%` }}
        />
      </div>
      {!loading && hasData && (
        <p className="text-xs text-slate-400 mt-1">
          {Math.round(percent)}% of {goal.toLocaleString()} goal
        </p>
      )}
      {!loading && !hasData && (
        <p className="text-xs text-slate-400 mt-1">No data available</p>
      )}
    </Card>
  );
}

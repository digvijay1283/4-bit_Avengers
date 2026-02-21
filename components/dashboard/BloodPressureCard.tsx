import Card from "@/components/ui/Card";

interface BloodPressureCardProps {
  bloodOxygen?: number;
  calories?: number;
  loading?: boolean;
}

export default function BloodPressureCard({
  bloodOxygen,
  calories,
  loading,
}: BloodPressureCardProps) {
  const spO2 = bloodOxygen ?? 0;
  const cal = calories ?? 0;
  const hasSpO2 = spO2 > 0;
  const hasCal = cal > 0;

  const spO2Status =
    spO2 >= 95
      ? { label: "Normal range", color: "text-green-600" }
      : spO2 >= 90
        ? { label: "Low — monitor closely", color: "text-orange-600" }
        : spO2 > 0
          ? { label: "Critical — seek help", color: "text-red-600" }
          : { label: "No data", color: "text-slate-400" };

  return (
    <Card className="p-5">
      {/* Blood Oxygen (SpO2) */}
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-primary shadow-sm">
          <span className="material-symbols-outlined">water_drop</span>
        </div>
        <span className="text-slate-400 text-xs">SpO₂</span>
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {hasSpO2 ? `${spO2}%` : "—"}
            </span>
            <span className="text-sm text-slate-500 ml-1">O₂</span>
          </>
        )}
      </div>
      <p className={`text-xs mt-1 font-medium ${spO2Status.color}`}>
        {loading ? "Fetching…" : spO2Status.label}
      </p>

      {/* Calories */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-amber-500 text-base">
            local_fire_department
          </span>
          <span className="text-xs text-slate-400">Calories Burned</span>
        </div>
        {loading ? (
          <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {hasCal ? `${cal.toLocaleString()} kcal` : "—"}
          </span>
        )}
      </div>
    </Card>
  );
}

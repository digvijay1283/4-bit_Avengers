import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface HeartRateCardProps {
  bpm?: number;
  loading?: boolean;
}

export default function HeartRateCard({ bpm, loading }: HeartRateCardProps) {
  const value = bpm ?? 0;
  const isElevated = value > 100;
  const isLow = value > 0 && value < 60;
  const hasData = value > 0;

  return (
    <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-200 dark:border-red-900/30 relative">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-red-500 shadow-sm">
          <span className="material-symbols-outlined">favorite</span>
        </div>
        {loading ? (
          <span className="text-xs text-slate-400">Loading…</span>
        ) : isElevated ? (
          <Badge variant="danger" pulse>
            Alert
          </Badge>
        ) : isLow ? (
          <Badge variant="warning">Low</Badge>
        ) : hasData ? (
          <Badge variant="success">Normal</Badge>
        ) : null}
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-9 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {hasData ? value : "—"}
            </span>
            <span className="text-sm text-slate-500 ml-1">bpm</span>
          </>
        )}
      </div>
      <p className="text-xs mt-1 font-medium">
        {loading ? (
          <span className="text-slate-400">Fetching heart rate…</span>
        ) : !hasData ? (
          <span className="text-slate-400">No data available</span>
        ) : isElevated ? (
          <span className="text-red-600">Elevated heart rate detected</span>
        ) : isLow ? (
          <span className="text-orange-600">Heart rate is below normal</span>
        ) : (
          <span className="text-green-600">Heart rate is normal</span>
        )}
      </p>
    </div>
  );
}

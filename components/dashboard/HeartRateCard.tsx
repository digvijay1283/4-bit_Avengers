import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface HeartRateCardProps {
  value?: number | null;
}

export default function HeartRateCard({ value = null }: HeartRateCardProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-200 dark:border-red-900/30 relative">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-red-500 shadow-sm">
          <span className="material-symbols-outlined">favorite</span>
        </div>
        <Badge variant="danger" pulse>
          Alert
        </Badge>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {value === null ? "-" : value}
        </span>
        <span className="text-sm text-slate-500 ml-1">bpm</span>
      </div>
      <p className="text-xs text-slate-500 mt-1 font-medium">
        No live data available
      </p>
    </div>
  );
}

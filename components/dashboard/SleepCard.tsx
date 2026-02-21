import Card from "@/components/ui/Card";

interface SleepCardProps {
  value?: string | null;
}

export default function SleepCard({ value = null }: SleepCardProps) {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-indigo-500 shadow-sm">
          <span className="material-symbols-outlined">bedtime</span>
        </div>
        <span className="text-slate-400 text-xs">Last Night</span>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {value ?? "-"}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-1 font-medium">
        No live data available
      </p>
    </Card>
  );
}

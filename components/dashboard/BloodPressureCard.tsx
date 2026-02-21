import Card from "@/components/ui/Card";

export default function BloodPressureCard() {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-primary shadow-sm">
          <span className="material-symbols-outlined">water_drop</span>
        </div>
        <span className="text-slate-400 text-xs">Now</span>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          120/80
        </span>
        <span className="text-sm text-slate-500 ml-1">mmHg</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">Normal range</p>
    </Card>
  );
}

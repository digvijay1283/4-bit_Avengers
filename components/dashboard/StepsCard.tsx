import Card from "@/components/ui/Card";

export default function StepsCard() {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-orange-500 shadow-sm">
          <span className="material-symbols-outlined">footprint</span>
        </div>
        <span className="text-slate-400 text-xs">Today</span>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          8,432
        </span>
        <span className="text-sm text-slate-500 ml-1">steps</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1 mt-3 dark:bg-gray-700">
        <div
          className="bg-orange-400 h-1 rounded-full transition-all duration-500"
          style={{ width: "84%" }}
        />
      </div>
    </Card>
  );
}

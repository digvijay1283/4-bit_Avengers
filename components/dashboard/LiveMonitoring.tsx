import { FileText } from "lucide-react";
import RiskScoreBadge from "./RiskScoreBadge";
import HeartRateCard from "./HeartRateCard";
import BloodPressureCard from "./BloodPressureCard";
import SleepCard from "./SleepCard";
import StepsCard from "./StepsCard";

export default function LiveMonitoring() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Live AI Health Monitoring
          </h2>
          <p className="text-slate-500 text-sm">
            Real-time analysis of your vital signs.
          </p>
        </div>
        <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <FileText className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Circular Progress (AI Risk Score) */}
        <RiskScoreBadge score={null} />

        {/* Vitals Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HeartRateCard />
          <BloodPressureCard />
          <SleepCard />
          <StepsCard />
        </div>
      </div>
    </div>
  );
}

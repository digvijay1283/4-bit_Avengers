"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFitnessData } from "@/hooks/useFitnessData";

const defaultWeeklyData = [
  { day: "Mon", heartRate: 72, steps: 6500, sleep: 7.2, calories: 1800 },
  { day: "Tue", heartRate: 68, steps: 8200, sleep: 6.8, calories: 2100 },
  { day: "Wed", heartRate: 85, steps: 5400, sleep: 7.5, calories: 1950 },
  { day: "Thu", heartRate: 62, steps: 9100, sleep: 8.0, calories: 2300 },
  { day: "Fri", heartRate: 54, steps: 7300, sleep: 6.5, calories: 2000 },
  { day: "Sat", heartRate: 78, steps: 4200, sleep: 8.2, calories: 1600 },
  { day: "Sun", heartRate: 58, steps: 6800, sleep: 7.8, calories: 1750 },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MetricKey = "heartRate" | "steps" | "sleep" | "calories";

const metricConfig: Record<MetricKey, { label: string; color: string; unit: string }> = {
  heartRate: { label: "Heart Rate", color: "#EF4444", unit: "bpm" },
  steps: { label: "Steps", color: "#F97316", unit: "steps" },
  sleep: { label: "Sleep", color: "#6366F1", unit: "hrs" },
  calories: { label: "Calories", color: "#EAB308", unit: "kcal" },
};

export default function WeeklyTrendChart() {
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("heartRate");
  const { data, connected } = useFitnessData(0); // don't auto-refresh here

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build chart data: use live data for today, defaults for other days
  const weeklyData = defaultWeeklyData.map((entry) => {
    const dayOfWeek = dayNames[new Date().getDay()];
    if (connected && data && entry.day === dayOfWeek) {
      return {
        ...entry,
        heartRate: data.heartRate || entry.heartRate,
        steps: data.steps || entry.steps,
        sleep: data.sleep || entry.sleep,
        calories: data.calories || entry.calories,
      };
    }
    return entry;
  });

  const config = metricConfig[activeMetric];

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="font-bold text-lg">Weekly Vital Trends</h3>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(Object.keys(metricConfig) as MetricKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeMetric === key
                  ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {metricConfig[key].label}
            </button>
          ))}
        </div>
      </div>

      {connected && data && (
        <div className="mb-4 flex items-center gap-2 text-xs text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live data for today from Google Fit
        </div>
      )}

      <div className="h-48 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`color-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "0.75rem",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value} ${config.unit}`, config.label]}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={config.color}
                strokeWidth={3}
                fill={`url(#color-${activeMetric})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-gray-50 dark:bg-slate-700 rounded-lg animate-pulse" />
        )}
      </div>
    </Card>
  );
}

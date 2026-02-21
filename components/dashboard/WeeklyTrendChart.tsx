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

const weeklyData = [
  { day: "Mon", heartRate: 72 },
  { day: "Tue", heartRate: 68 },
  { day: "Wed", heartRate: 85 },
  { day: "Thu", heartRate: 62 },
  { day: "Fri", heartRate: 54 },
  { day: "Sat", heartRate: 78 },
  { day: "Sun", heartRate: 58 },
];

export default function WeeklyTrendChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg">Weekly Vital Trends</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary" />
          <span className="text-xs text-slate-500">Heart Rate</span>
        </div>
      </div>

      <div className="h-48 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#106534" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#106534" stopOpacity={0} />
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
              />
              <Area
                type="monotone"
                dataKey="heartRate"
                stroke="#106534"
                strokeWidth={3}
                fill="url(#colorHR)"
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

"use client";

import { FileText, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useFitnessData } from "@/hooks/useFitnessData";
import RiskScoreBadge from "./RiskScoreBadge";
import HeartRateCard from "./HeartRateCard";
import BloodPressureCard from "./BloodPressureCard";
import SleepCard from "./SleepCard";
import StepsCard from "./StepsCard";

/**
 * Compute a simple AI risk score (0–100) from the available vitals.
 * Higher = better health.
 */
function computeRiskScore(data: {
  heartRate: number;
  steps: number;
  sleep: number;
  bloodOxygen: number;
  calories: number;
}): number {
  let score = 100;

  // Heart rate scoring (ideal 60-100 bpm)
  if (data.heartRate > 0) {
    if (data.heartRate > 100) score -= Math.min((data.heartRate - 100) * 2, 20);
    else if (data.heartRate < 60) score -= Math.min((60 - data.heartRate) * 2, 15);
  }

  // Steps scoring (ideal >= 8000)
  if (data.steps > 0) {
    if (data.steps < 5000) score -= 15;
    else if (data.steps < 8000) score -= 5;
  } else {
    score -= 10; // no data penalty
  }

  // Sleep scoring (ideal 7-9 hours)
  if (data.sleep > 0) {
    if (data.sleep < 5) score -= 15;
    else if (data.sleep < 7) score -= 5;
    else if (data.sleep > 9) score -= 5;
  } else {
    score -= 10;
  }

  // Blood oxygen scoring (ideal >= 95%)
  if (data.bloodOxygen > 0) {
    if (data.bloodOxygen < 90) score -= 25;
    else if (data.bloodOxygen < 95) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

export default function LiveMonitoring() {
  const {
    data,
    loading,
    connected,
    checkingConnection,
    refresh,
    connect,
    disconnect,
  } = useFitnessData(60_000); // auto-refresh every 60s

  const riskScore = data ? computeRiskScore(data) : 88;
  const isLoading = loading || checkingConnection;

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

        <div className="flex items-center gap-2">
          {/* Connection status / connect button */}
          {connected ? (
            <>
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full font-medium">
                <Wifi className="h-3 w-3" />
                Google Fit Connected
              </span>
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </>
          ) : !checkingConnection ? (
            <button
              onClick={connect}
              className="flex items-center gap-2 text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Wifi className="h-4 w-4" />
              Connect Google Fit
            </button>
          ) : null}

          <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <FileText className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Circular Progress (AI Risk Score) */}
        <RiskScoreBadge score={connected && data ? riskScore : 88} />

        {/* Vitals Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HeartRateCard bpm={data?.heartRate} loading={isLoading} />
          <BloodPressureCard
            bloodOxygen={data?.bloodOxygen}
            calories={data?.calories}
            loading={isLoading}
          />
          <SleepCard sleepHours={data?.sleep} loading={isLoading} />
          <StepsCard steps={data?.steps} loading={isLoading} />
        </div>
      </div>

      {/* Disconnect option (small, subtle) */}
      {connected && (
        <div className="mt-4 text-right">
          <button
            onClick={disconnect}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <WifiOff className="h-3 w-3 inline mr-1" />
            Disconnect Google Fit
          </button>
        </div>
      )}
    </div>
  );
}

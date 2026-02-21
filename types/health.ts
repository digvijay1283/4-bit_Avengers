/**
 * Health data types — vitals, daily health, risk scores.
 */

export type RiskLevel = "low" | "medium" | "high";

export type HeartRateData = {
  avg: number;
  min: number;
  max: number;
  readings: { time: string; value: number }[];
};

export type SleepData = {
  totalMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
};

export type DailyHealth = {
  date: string;
  heartRate: HeartRateData;
  steps: number;
  distance: number;
  caloriesBurned: number;
  sleep: SleepData;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  riskScore: RiskLevel;
  updatedAt: string;
};

export type WeeklyTrend = {
  day: string;
  heartRate: number;
  steps: number;
  sleep: number;
  calories: number;
};

export type VitalCard = {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  status: "normal" | "warning" | "alert";
  subtitle?: string;
  progress?: number;
};

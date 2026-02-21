/**
 * Fitness data types matching the stats server responses.
 */

export interface FitnessData {
  steps: number;
  heartRate: number;
  sleep: number;       // hours (e.g. 7.5)
  calories: number;
  bloodOxygen: number; // percentage (e.g. 98)
}

export interface FitnessStatus {
  connected: boolean;
}

export interface FitnessAuthUrl {
  url: string;
}

export type FitnessMetric = "steps" | "heartrate" | "sleep" | "calories" | "bloodoxygen";

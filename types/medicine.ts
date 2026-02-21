/**
 * Medicine & Medical Test types for the Medi Reminder module.
 */

export type MedicineStatus = "taken" | "missed" | "due-soon" | "upcoming" | "snoozed";
export type MedicalTestStatus = "completed" | "pending" | "overdue" | "scheduled";

export type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instruction: string;
  time: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  status: MedicineStatus;
  accentColor: string;
};

export type MedicalTest = {
  id: string;
  name: string;
  description: string;
  scheduledDate: string;
  scheduledTime?: string;
  location?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  status: MedicalTestStatus;
  accentColor: string;
};

export type DailyProgress = {
  taken: number;
  missed: number;
  pending: number;
  total: number;
};

export type LowStockItem = {
  name: string;
  daysLeft: number;
  percentLeft: number;
};

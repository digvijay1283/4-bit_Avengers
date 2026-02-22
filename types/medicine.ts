/**
 * Medicine & Medical Test types for the Medi Reminder module.
 */

export type MedicineStatus = "taken" | "missed" | "due-soon" | "upcoming" | "snoozed";
export type MedicalTestStatus = "completed" | "pending" | "overdue" | "scheduled";

export type Medicine = {
  _id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  instruction: string;
  times: string[];          // ["09:00","21:00"]
  type: "medicine" | "supplement" | "other";
  source: "manual" | "ocr";
  status: MedicineStatus;
  isActive: boolean;
  totalQuantity: number;
  remainingQuantity: number;
  missedStreakCount: number; // consecutive missed doses - alerts after 5
  nextReminderTime?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Lightweight version returned from OCR before user confirms */
export type ExtractedMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instruction: string;
};

export type DoseAction = "taken" | "snoozed" | "missed" | "skipped";

export type DoseLog = {
  _id: string;
  medicineId: string;
  userId: string;
  scheduledTime: string;   // "09:00"
  action: DoseAction;
  actionAt: string;        // ISO timestamp
  createdAt: string;
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
  snoozed: number;
  pending: number;
  total: number;
};

export type LowStockItem = {
  name: string;
  daysLeft: number;
  percentLeft: number;
};

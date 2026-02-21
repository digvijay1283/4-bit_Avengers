import { Schema, Document, Model, models, model } from "mongoose";

// ─── Document interface ───────────────────────────────────────────────────────
export interface IDoseLog extends Document {
  medicineId: string;
  userId: string;
  scheduledTime: string;          // "09:00"
  scheduledDate: string;          // "2025-02-20"
  action: "taken" | "snoozed" | "missed" | "skipped";
  actionAt: Date;
  createdAt: Date;
}

type DoseLogModel = Model<IDoseLog>;

const DoseLogSchema = new Schema<IDoseLog>(
  {
    medicineId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    scheduledTime: { type: String, required: true },
    scheduledDate: { type: String, required: true },
    action: {
      type: String,
      enum: ["taken", "snoozed", "missed", "skipped"],
      required: true,
    },
    actionAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "dose_logs",
  }
);

DoseLogSchema.index(
  { medicineId: 1, scheduledDate: 1, scheduledTime: 1 },
  { name: "idx_doselog_med_date_time" }
);
DoseLogSchema.index({ userId: 1, scheduledDate: 1 }, { name: "idx_doselog_user_date" });

const DoseLog: DoseLogModel =
  (models.DoseLog as DoseLogModel) || model<IDoseLog>("DoseLog", DoseLogSchema);

export default DoseLog;

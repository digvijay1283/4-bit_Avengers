import { Model, Schema, model, models, Document } from "mongoose";

export interface IHealthRecord extends Document {
  userId: string;
  type: "vitals" | "lab" | "prescription" | "note" | "report";
  title: string;
  summary?: string;
  data: Record<string, unknown>;
  recordDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

type HealthRecordModel = Model<IHealthRecord>;

const healthRecordSchema = new Schema<IHealthRecord>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["vitals", "lab", "prescription", "note", "report"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    data: { type: Schema.Types.Mixed, default: {} },
    recordDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "health_records",
  }
);

healthRecordSchema.index(
  { userId: 1, type: 1, recordDate: -1 },
  { name: "idx_hr_userId_type_date" }
);

healthRecordSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "idx_hr_userId_createdAt" }
);

export const HealthRecord: HealthRecordModel =
  (models.HealthRecord as HealthRecordModel) ??
  model<IHealthRecord>("HealthRecord", healthRecordSchema);

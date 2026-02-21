import mongoose, { Schema, Document, Model, models, model } from "mongoose";

// Document interface
export interface IMedicine extends Document {
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  instruction: string;
  times: string[];                // ["09:00","21:00"]
  type: "medicine" | "supplement" | "other";
  source: "manual" | "ocr";
  isActive: boolean;
  totalQuantity: number;
  remainingQuantity: number;
  missedStreakCount: number;      // consecutive missed - alert after >= 2
  createdAt: Date;
  updatedAt: Date;
}

type MedicineModel = Model<IMedicine>;

const MedicineSchema = new Schema<IMedicine>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    instruction: { type: String, default: "" },
    times: [{ type: String }],
    type: {
      type: String,
      enum: ["medicine", "supplement", "other"],
      default: "medicine",
    },
    source: {
      type: String,
      enum: ["manual", "ocr"],
      default: "manual",
    },
    isActive: { type: Boolean, default: true },
    totalQuantity: { type: Number, default: 30 },
    remainingQuantity: { type: Number, default: 30 },
    missedStreakCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "medicines",
  }
);

MedicineSchema.index({ userId: 1, isActive: 1 }, { name: "idx_med_user_active" });

const Medicine: MedicineModel =
  (models.Medicine as MedicineModel) || model<IMedicine>("Medicine", MedicineSchema);

export default Medicine;

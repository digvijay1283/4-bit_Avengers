import { randomUUID } from "crypto";
import { Model, Schema, model, models, Document } from "mongoose";
import type { ExtractedMedicalInfo } from "@/lib/medicalReportParser";

// ─── Document interface ───────────────────────────────────────────────────────
export interface IReport extends Document {
  reportId: string;
  userId: string; // links to User.userId
  fileName: string;
  fileUrl: string; // Cloudinary secure URL
  cloudinaryPublicId: string;
  rawText: string; // OCR raw output
  extractedData: ExtractedMedicalInfo | null;
  status: "processing" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

type ReportModel = Model<IReport>;

// ─── Schema ───────────────────────────────────────────────────────────────────
const reportSchema = new Schema<IReport>(
  {
    reportId: {
      type: String,
      default: () => randomUUID(),
      immutable: true,
    },
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    rawText: { type: String, default: "" },
    extractedData: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
reportSchema.index({ reportId: 1 }, { unique: true, name: "uq_reports_reportId" });
reportSchema.index({ userId: 1, createdAt: -1 }, { name: "idx_reports_userId_date" });

// ─── Export ───────────────────────────────────────────────────────────────────
export const Report: ReportModel =
  (models.Report as ReportModel) ?? model<IReport>("Report", reportSchema);

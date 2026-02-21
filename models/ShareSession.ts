import { randomUUID } from "crypto";
import { Model, Schema, model, models, Document } from "mongoose";

// ─── Document interface ───────────────────────────────────────────────────────
export interface IShareSession extends Document {
  token: string; // short random token used in QR payload
  shareCode: string; // short patient-facing code, e.g. pid-kx83ab1f
  patientUserId: string; // links to User.userId (patient)
  selectedReportIds: string[]; // array of Report.reportId values
  expiresAt: Date; // auto-expire (TTL)
  createdAt: Date;
  updatedAt: Date;
}

type ShareSessionModel = Model<IShareSession>;

// ─── Schema ───────────────────────────────────────────────────────────────────
const shareSessionSchema = new Schema<IShareSession>(
  {
    token: {
      type: String,
      default: () => randomUUID(),
      immutable: true,
    },
    shareCode: {
      type: String,
      default: () => `pid-${Date.now().toString(36)}${randomUUID().replace(/-/g, "").slice(0, 2)}`,
      immutable: true,
    },
    patientUserId: { type: String, required: true },
    selectedReportIds: { type: [String], required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min
    },
  },
  {
    timestamps: true,
    collection: "share_sessions",
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
shareSessionSchema.index({ token: 1 }, { unique: true, name: "uq_share_token" });
shareSessionSchema.index({ shareCode: 1 }, { unique: true, name: "uq_share_code" });
shareSessionSchema.index({ patientUserId: 1 }, { name: "idx_share_patientUserId" });
// MongoDB TTL index — automatically deletes documents after expiresAt
shareSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_share_expiresAt" });

// ─── Export ───────────────────────────────────────────────────────────────────
export const ShareSession: ShareSessionModel =
  (models.ShareSession as ShareSessionModel) ??
  model<IShareSession>("ShareSession", shareSessionSchema);

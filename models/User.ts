import { randomUUID } from "crypto";
import { Model, Schema, model, models, Document } from "mongoose";

// ─── Document interface ───────────────────────────────────────────────────────
export interface IUser extends Document {
  userId: string;                // app-level UUID, separate from MongoDB _id
  email: string;
  fullName: string;
  passwordHash: string;          // always stored; select: false keeps it hidden
  avatarUrl?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  bloodType?: string;
  weight?: string;               // e.g. "75kg"
  height?: string;               // e.g. "182cm"
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  role: "user" | "doctor" | "admin";
  status: "active" | "inactive";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Model type (no custom statics needed — syncIndexes is on Model already)
type UserModel = Model<IUser>;

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    // Auto-generated UUID — stable, shareable app-level user identifier
    userId: {
      type: String,
      default: () => randomUUID(),
      immutable: true,           // never changes after creation
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    // passwordHash is NEVER returned by default; callers must .select("+passwordHash")
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, trim: true },
    dateOfBirth: { type: Date },
    address: { type: String, trim: true },
    bloodType: { type: String, trim: true },
    weight: { type: String, trim: true },
    height: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    // Doctor-specific
    specialization: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    role: { type: String, enum: ["user", "doctor", "admin"], default: "user" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
    collection: "users",
  }
);

// ─── Indexes (separate, named, explicit) ─────────────────────────────────────
// 0. Unique userId — app-level identifier, used in JWTs and API responses
userSchema.index({ userId: 1 }, { unique: true, name: "uq_users_userId" });

// 1. Unique email — primary lookup + duplicate prevention
userSchema.index({ email: 1 }, { unique: true, name: "uq_users_email" });

// 2. Unique phone — sparse so null/undefined rows don't conflict
userSchema.index({ phone: 1 }, { unique: true, sparse: true, name: "uq_users_phone_sparse" });

// 3. Compound role + status — for role-based dashboards filtering active/inactive users
userSchema.index({ role: 1, status: 1 }, { name: "idx_users_role_status" });

// 4. createdAt descending — for chronological user listings / pagination
userSchema.index({ createdAt: -1 }, { name: "idx_users_createdAt_desc" });

// ─── Export ───────────────────────────────────────────────────────────────────
export const User: UserModel =
  (models.User as UserModel) ?? model<IUser>("User", userSchema);

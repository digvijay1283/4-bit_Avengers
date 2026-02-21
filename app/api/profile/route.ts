import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/rbac";
import { User } from "@/models/User";

/* ── GET /api/profile ── Return the full profile for the logged-in user ──── */
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();
  const user = await User.findOne({ userId: auth.userId }).lean();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "User not found" },
      { status: 404 },
    );
  }

  // Normalise role for the client ("admin" → "doctor")
  const role: "user" | "doctor" =
    user.role === "admin" ? "doctor" : (user.role as "user" | "doctor");

  return NextResponse.json({
    ok: true,
    profile: {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      gender: user.gender ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      address: user.address ?? null,
      bloodType: user.bloodType ?? null,
      weight: user.weight ?? null,
      height: user.height ?? null,
      emergencyContactName: user.emergencyContactName ?? null,
      emergencyContactPhone: user.emergencyContactPhone ?? null,
      specialization: user.specialization ?? null,
      licenseNumber: user.licenseNumber ?? null,
      role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

/* ── PATCH /api/profile ── Update editable profile fields ───────────────── */

// Fields users are allowed to update
const ALLOWED_FIELDS = [
  "fullName",
  "phone",
  "gender",
  "dateOfBirth",
  "address",
  "bloodType",
  "weight",
  "height",
  "avatarUrl",
  "emergencyContactName",
  "emergencyContactPhone",
  "specialization",
  "licenseNumber",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        const val = body[key];
        if (key === "dateOfBirth") {
          if (val === null || val === "") {
            updates[key] = null;
          } else if (typeof val === "string") {
            const parsed = new Date(val);
            if (Number.isNaN(parsed.getTime())) {
              return NextResponse.json(
                { ok: false, message: "Invalid date of birth" },
                { status: 400 },
              );
            }
            updates[key] = parsed;
          } else {
            updates[key] = null;
          }
        } else {
          updates[key] =
            typeof val === "string" ? val.trim() || null : val ?? null;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, message: "No valid fields to update" },
        { status: 400 },
      );
    }

    await dbConnect();
    const updated = await User.findOneAndUpdate(
      { userId: auth.userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "User not found" },
        { status: 404 },
      );
    }

    const role: "user" | "doctor" =
      updated.role === "admin" ? "doctor" : (updated.role as "user" | "doctor");

    return NextResponse.json({
      ok: true,
      profile: {
        userId: updated.userId,
        email: updated.email,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl ?? null,
        phone: updated.phone ?? null,
        gender: updated.gender ?? null,
        dateOfBirth: updated.dateOfBirth ?? null,
        address: updated.address ?? null,
        bloodType: updated.bloodType ?? null,
        weight: updated.weight ?? null,
        height: updated.height ?? null,
        emergencyContactName: updated.emergencyContactName ?? null,
        emergencyContactPhone: updated.emergencyContactPhone ?? null,
        specialization: updated.specialization ?? null,
        licenseNumber: updated.licenseNumber ?? null,
        role,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (/E11000 duplicate key/i.test(message)) {
      return NextResponse.json(
        { ok: false, message: "Phone number already exists for another user" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to update profile", error: message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      role?: "user" | "doctor";
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      specialization?: string;
      licenseNumber?: string;
    };

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";
    const role = body.role === "doctor" ? "doctor" : "user";
    const roleForPersistence: "user" | "doctor" | "admin" =
      role === "doctor" ? "admin" : "user";
    const emergencyContactName = body.emergencyContactName?.trim() || undefined;
    const emergencyContactPhone = body.emergencyContactPhone?.trim() || undefined;
    const specialization = body.specialization?.trim() || undefined;
    const licenseNumber = body.licenseNumber?.trim() || undefined;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { ok: false, message: "fullName, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const created = await User.create({
      fullName,
      email,
      passwordHash,
      role: roleForPersistence,
      ...(emergencyContactName && { emergencyContactName }),
      ...(emergencyContactPhone && { emergencyContactPhone }),
      ...(specialization && { specialization }),
      ...(licenseNumber && { licenseNumber }),
    });

    const normalizedRole: "user" | "doctor" =
      created.role === "admin" ? "doctor" : created.role;

    return NextResponse.json(
      {
        ok: true,
        message: "Account created successfully.",
        user: {
          userId: created.userId,
          fullName: created.fullName,
          email: created.email,
          role: normalizedRole,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (/querySrv\s+ECONNREFUSED|ENOTFOUND|ECONNREFUSED|timed out/i.test(message)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Database is currently unreachable. Please verify MongoDB URI/DNS and try again.",
          error: message,
        },
        { status: 503 }
      );
    }

    if (/E11000 duplicate key/i.test(message)) {
      return NextResponse.json(
        { ok: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Signup failed.", error: message },
      { status: 500 }
    );
  }
}

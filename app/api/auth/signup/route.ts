import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { hashPassword, signAuthToken } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

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

    await dbConnect();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const created = await User.create({ fullName, email, passwordHash });

    const token = signAuthToken({
      sub: created.userId,
      email: created.email,
      role: created.role,
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: "Account created successfully.",
        user: {
          userId: created.userId,
          fullName: created.fullName,
          email: created.email,
          role: created.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: "Signup failed.", error: message },
      { status: 500 }
    );
  }
}

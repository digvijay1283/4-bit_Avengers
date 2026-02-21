import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { comparePassword, signAuthToken } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "email and password are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken({
      sub: user.userId,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: "Login successful.",
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
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
      { ok: false, message: "Login failed", error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ ok: true, authenticated: false, user: null });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      userId: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
  });
}

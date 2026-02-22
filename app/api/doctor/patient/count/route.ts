import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { ShareSession } from "@/models/ShareSession";

/**
 * GET /api/doctor/patient/count
 *
 * Returns the number of unique patients who have shared reports
 * with this doctor (based on ShareSession records).
 * Only accessible by doctor role.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    const callerRole = (payload as { role?: string }).role;
    if (callerRole !== "doctor" && callerRole !== "admin") {
      return NextResponse.json({ count: 0 }, { status: 403 });
    }

    await dbConnect();

    // Count distinct patients who have shared reports
    const uniquePatients = await ShareSession.distinct("patientUserId");

    return NextResponse.json({ count: uniquePatients.length });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

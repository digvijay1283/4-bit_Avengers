import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Report } from "@/models/Report";

export const runtime = "nodejs";

/**
 * GET /api/reports — list all reports for the authenticated user.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();

    const reports = await Report.find({ userId: payload.sub })
      .sort({ createdAt: -1 })
      .select("reportId fileName fileUrl rawText extractedData status createdAt")
      .lean();

    return NextResponse.json({ success: true, reports });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch reports.";
    console.error("[reports] GET error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/reports?reportId=xxx — delete a report by ID.
 */
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json({ success: false, error: "reportId is required" }, { status: 400 });
    }

    await dbConnect();

    const deleted = await Report.findOneAndDelete({
      reportId,
      userId: payload.sub,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Optionally delete from Cloudinary too
    try {
      const { default: cloudinary } = await import("@/lib/cloudinary");
      await cloudinary.uploader.destroy(deleted.cloudinaryPublicId);
    } catch (e) {
      console.error("[reports] Cloudinary delete failed:", e);
    }

    return NextResponse.json({ success: true, deleted: reportId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    console.error("[reports] DELETE error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

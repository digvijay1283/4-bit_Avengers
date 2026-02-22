import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Report } from "@/models/Report";

/**
 * GET /api/doctor/patient/[id]/reports
 *
 * Returns all reports for a patient.
 * Only accessible by doctor role.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    const callerRole = (payload as { role?: string }).role;
    if (callerRole !== "doctor" && callerRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: patientId } = await params;

    await dbConnect();

    const reports = await Report.find({ userId: patientId })
      .sort({ createdAt: -1 })
      .select(
        "reportId fileName fileUrl rawText extractedData summary status createdAt"
      )
      .lean();

    // Classify severity based on summary/extractedData content
    const classifiedReports = reports.map((report) => {
      const text = `${report.summary ?? ""} ${JSON.stringify(report.extractedData ?? {})}`.toLowerCase();

      let severity: "normal" | "attention" | "critical" = "normal";
      if (
        /critical|abnormal|high risk|urgent|danger|very high|very low|severe/.test(
          text
        )
      ) {
        severity = "critical";
      } else if (
        /borderline|slightly|elevated|below normal|above normal|pre-diabetic|attention/.test(
          text
        )
      ) {
        severity = "attention";
      }

      return {
        id: report.reportId,
        title: report.fileName,
        date: report.createdAt,
        summary: report.summary || "No AI summary available yet.",
        fileUrl: report.fileUrl,
        rawText: report.rawText,
        extractedData: report.extractedData,
        type: report.extractedData ? "lab" : "report",
        status: report.status,
        severity,
      };
    });

    return NextResponse.json({
      success: true,
      reports: classifiedReports,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

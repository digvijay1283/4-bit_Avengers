import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recognize } from "tesseract.js";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { parseMedicalReportText } from "@/lib/medicalReportParser";
import { Report } from "@/models/Report";
import { HealthRecord } from "@/models/HealthRecord";

export const runtime = "nodejs";
const N8N_WEBHOOK_URL = "https://synthomind.cloud/webhook/user-report-info";
const SUMMARY_WEBHOOK_URL =
  "https://synthomind.cloud/webhook/mental-cavista-summary";

export async function POST(request: Request) {
  console.log("[reports/upload] POST called");
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    console.log("[reports/upload] auth token present:", !!token);
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    const userId = payload.sub;

    // ── Parse form data ─────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid report file." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload JPG, PNG, WEBP, or PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Upload to Cloudinary ────────────────────────────────────────────────
    console.log("[reports/upload] Uploading to Cloudinary...");
    const { secureUrl, publicId } = await uploadToCloudinary(buffer, {
      folder: "vitalai/reports",
    });
    console.log("[reports/upload] Cloudinary done:", secureUrl?.slice(0, 60));

    // ── OCR extraction (images only) ────────────────────────────────────────
    let rawText = "";
    let extractedData = null;

    const isImage = file.type.startsWith("image/");
    if (isImage) {
      try {
        const { data } = await recognize(buffer, "eng", {
          logger: () => undefined,
        });
        rawText = data.text?.trim() || "";

        if (rawText) {
          extractedData = parseMedicalReportText(rawText);
        }
      } catch (ocrErr) {
        console.error("[reports/upload] OCR failed:", ocrErr);
        // OCR failure is non-fatal — we still save the file
      }
    }

    // ── Save to MongoDB ─────────────────────────────────────────────────────
    console.log("[reports/upload] OCR done. rawText length:", rawText.length);
    console.log("[reports/upload] Saving to MongoDB...");
    await dbConnect();

    const report = await Report.create({
      userId,
      fileName: file.name,
      fileUrl: secureUrl,
      cloudinaryPublicId: publicId,
      rawText,
      extractedData,
      status: rawText ? "completed" : "processing",
    });

    console.log("[reports/upload] MongoDB saved. reportId:", report.reportId);

    // ── Create HealthRecords from extracted data ────────────────────────────
    try {
      const healthRecords: Array<{
        userId: string;
        type: "vitals" | "lab" | "prescription" | "note" | "report";
        title: string;
        summary?: string;
        data: Record<string, unknown>;
        recordDate: Date;
      }> = [];

      const now = new Date();

      // 1. Overall report record
      healthRecords.push({
        userId,
        type: "report",
        title: `Report: ${file.name}`,
        summary: extractedData?.nlp?.summary || rawText.slice(0, 300) || "Report uploaded",
        data: {
          reportId: report.reportId,
          fileName: file.name,
          rawText,
          extractedData,
          riskScore: extractedData?.nlp?.severity ?? "low",
        },
        recordDate: now,
      });

      // 2. Prescription records (if medications found)
      if (extractedData?.nlp?.medications?.length) {
        healthRecords.push({
          userId,
          type: "prescription",
          title: `Prescription: ${file.name}`,
          summary: `${extractedData.nlp.medications.length} medication(s) extracted`,
          data: {
            reportId: report.reportId,
            medications: extractedData.nlp.medications,
          },
          recordDate: now,
        });
      }

      // 3. Lab / abnormal findings
      if (extractedData?.nlp?.abnormalFindings?.length) {
        healthRecords.push({
          userId,
          type: "lab",
          title: `Lab Findings: ${file.name}`,
          summary: `${extractedData.nlp.abnormalFindings.length} attention-worthy finding(s)`,
          data: {
            reportId: report.reportId,
            abnormalFindings: extractedData.nlp.abnormalFindings,
            severity: extractedData.nlp.severity,
          },
          recordDate: now,
        });
      }

      // 4. Extract vitals from raw text (BP, heart rate, etc.)
      if (rawText) {
        const vitalsData: Record<string, unknown> = {};

        const bpMatch = rawText.match(
          /(?:blood\s*pressure|b\.?p\.?)\s*[:\-]?\s*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i
        );
        if (bpMatch) {
          vitalsData.bloodPressure = {
            systolic: Number(bpMatch[1]),
            diastolic: Number(bpMatch[2]),
          };
        }

        const hrMatch = rawText.match(
          /(?:heart\s*rate|pulse|h\.?r\.?)\s*[:\-]?\s*(\d{2,3})\s*(?:bpm|beats|\/min)?/i
        );
        if (hrMatch) {
          vitalsData.heartRate = Number(hrMatch[1]);
        }

        const tempMatch = rawText.match(
          /(?:temperature|temp)\s*[:\-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:°?[FCfc])?/i
        );
        if (tempMatch) {
          vitalsData.temperature = Number(tempMatch[1]);
        }

        // Map NLP severity → riskScore
        vitalsData.riskScore = extractedData?.nlp?.severity ?? "low";

        // Only create vitals record if we found actual vitals (not just riskScore)
        const vitalsKeys = Object.keys(vitalsData).filter((k) => k !== "riskScore");
        if (vitalsKeys.length > 0) {
          healthRecords.push({
            userId,
            type: "vitals",
            title: `Vitals: ${file.name}`,
            summary: "Vitals extracted from medical report",
            data: vitalsData,
            recordDate: now,
          });
        }
      }

      if (healthRecords.length > 0) {
        await HealthRecord.insertMany(healthRecords);
        console.log(
          "[reports/upload] Created",
          healthRecords.length,
          "HealthRecord(s) for userId:",
          userId
        );
      }
    } catch (hrErr) {
      // HealthRecord creation is non-fatal — the Report is already saved
      console.error("[reports/upload] HealthRecord creation failed (non-fatal):", hrErr);
    }

    // ── Send extracted data to n8n webhook ─────────────────────────────────
    console.log("[reports/upload] Calling n8n webhook:", N8N_WEBHOOK_URL);
    const webhookPayload = {
      reportId: report.reportId,
      userId,
      fileName: file.name,
      fileUrl: secureUrl,
      rawText,
      extractedData,
      status: report.status,
      createdAt: report.createdAt,
    };

    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error("[reports/upload] n8n webhook returned non-2xx:", webhookResponse.status);
      } else {
        console.log("[reports/upload] user-report-info webhook success");
      }
    } catch (webhookError) {
      console.error("[reports/upload] n8n webhook failed:", webhookError);
    }

    // ── Call report-upload-summary webhook (for AI summary → sessionStorage) ─
    let summary: string | null = null;
    console.log("[reports/upload] Calling summary webhook:", SUMMARY_WEBHOOK_URL);
    try {
      const summaryRes = await fetch(SUMMARY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          trigger: "report_upload",
          fileName: file.name,
          rawText,
          extractedData,
        }),
      });

      console.log("[reports/upload] Summary webhook status:", summaryRes.status);

      if (summaryRes.ok) {
        // n8n may return: [{"output":"..."}] as JSON, or as a string, or just text
        const rawBody = await summaryRes.text();
        console.log("[reports/upload] Summary raw response:", rawBody.slice(0, 300));

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawBody);
        } catch {
          // Response is plain text, not JSON
          parsed = rawBody;
        }

        // Handle: [{"output":"..."}] or {"output":"..."} or plain string
        if (Array.isArray(parsed)) {
          summary = parsed
            .map((item: Record<string, unknown>) =>
              typeof item === "object" && item !== null
                ? String(item.output ?? "")
                : String(item)
            )
            .join("")
            .trim();
        } else if (typeof parsed === "object" && parsed !== null) {
          summary = String((parsed as Record<string, unknown>).output ?? "").trim();
        } else if (typeof parsed === "string") {
          summary = parsed.trim();
        }

        if (!summary || summary === "NO_USER_DATA_FOUND") {
          summary = null;
        }
        console.log("[reports/upload] Summary extracted, length:", summary?.length ?? 0);
      }
    } catch (summaryErr) {
      console.error("[reports/upload] Summary webhook failed:", summaryErr);
    }

    // ── Build fallback summary if webhook returned nothing ─────────────────
    if (!summary) {
      if (extractedData?.nlp?.summary) {
        summary = `${file.name}: ${extractedData.nlp.summary}`;
      } else if (rawText) {
        summary = `${file.name}: ${rawText.replace(/\s+/g, " ").slice(0, 800)}`;
      }
      if (summary) {
        console.log("[reports/upload] Using fallback summary, length:", summary.length);
      }
    }

    // ── Persist summary to the Report document ──────────────────────────────
    if (summary) {
      try {
        await Report.updateOne(
          { _id: report._id },
          { $set: { summary } }
        );
        console.log("[reports/upload] Summary persisted to Report document");
      } catch (sumSaveErr) {
        console.error("[reports/upload] Failed to persist summary (non-fatal):", sumSaveErr);
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        reportId: report.reportId,
        fileName: report.fileName,
        fileUrl: report.fileUrl,
        rawText: report.rawText,
        extractedData: report.extractedData,
        status: report.status,
        createdAt: report.createdAt,
      },
      summary,
      userId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[reports/upload] error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

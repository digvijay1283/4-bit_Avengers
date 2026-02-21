import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recognize } from "tesseract.js";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { parseMedicalReportText } from "@/lib/medicalReportParser";
import { Report } from "@/models/Report";

export const runtime = "nodejs";
const N8N_WEBHOOK_URL = "https://synthomind.cloud/webhook/user-report-info";

export async function POST(request: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
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
    const { secureUrl, publicId } = await uploadToCloudinary(buffer, {
      folder: "vitalai/reports",
    });

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

    // ── Send extracted data to n8n webhook ─────────────────────────────────
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
      }
    } catch (webhookError) {
      console.error("[reports/upload] n8n webhook failed:", webhookError);
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[reports/upload] error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { recognize } from "tesseract.js";
import { parseMedicalReportText } from "@/lib/medicalReportParser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid report file." },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Please upload JPG, PNG, or WEBP images.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const { data } = await recognize(imageBuffer, "eng", {
      logger: () => undefined,
    });

    const rawText = data.text?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "OCR could not detect text from the image." },
        { status: 422 }
      );
    }

    const extracted = parseMedicalReportText(rawText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      rawText,
      extracted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "OCR extraction failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { recognize } from "tesseract.js";
import { verifyAuthToken, getTokenFromRequest } from "@/lib/auth";

/**
 * Enhanced NLP parser — extract medicine entries from raw OCR text.
 * Returns candidate medicines for user review (NOT auto-saved).
 */
function parsePrescriptionText(rawText: string) {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 3);

  const medicines: {
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    instruction: string;
  }[] = [];

  // Robust regexes
  const dosageRegex =
    /(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|µg|g|IU|unit|tablet|capsule|cap|tab)s?)/i;
  const frequencyRegex =
    /(\d-\d-\d|twice\s*(?:a\s*)?daily|thrice\s*(?:a\s*)?daily|once\s*(?:a\s*)?daily|daily|(?:every|per)\s*\d+\s*hours?|(?:morning|evening|night|bedtime|noon))/i;
  const instructionRegex =
    /(before\s*(?:food|meals?|breakfast|lunch|dinner)|after\s*(?:food|meals?|breakfast|lunch|dinner)|with\s*(?:food|meals?|water|milk)|on\s*empty\s*stomach)/i;

  for (const line of lines) {
    const dosageMatch = line.match(dosageRegex);
    const freqMatch = line.match(frequencyRegex);

    if (dosageMatch || freqMatch) {
      let name = line
        .replace(dosageMatch?.[0] || "", "")
        .replace(freqMatch?.[0] || "", "")
        .replace(instructionRegex, "")
        .trim()
        .replace(/[^a-zA-Z0-9\s\-]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (name.length < 2) continue;
      // Capitalize first letter of each word
      name = name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      const instrMatch = line.match(instructionRegex);

      // Derive times from frequency
      let times = ["09:00"];
      const freq = freqMatch?.[0]?.toLowerCase() || "";
      if (freq.includes("twice") || freq === "1-0-1") {
        times = ["09:00", "21:00"];
      } else if (freq === "1-1-1" || freq.includes("thrice")) {
        times = ["08:00", "14:00", "21:00"];
      } else if (freq.includes("night") || freq.includes("bedtime")) {
        times = ["21:00"];
      } else if (freq.includes("morning")) {
        times = ["08:00"];
      }

      medicines.push({
        name,
        dosage: dosageMatch ? dosageMatch[0].trim() : "As prescribed",
        frequency: freqMatch ? freqMatch[0].trim() : "Daily",
        times,
        instruction: instrMatch ? instrMatch[0].trim() : "",
      });
    }
  }

  return medicines;
}

export async function POST(req: NextRequest) {
  try {
    // ─── Auth ───────────────────────────────────────────────────
    const token = await getTokenFromRequest();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    verifyAuthToken(token); // throws if invalid

    // ─── Read file from FormData ────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Prescription image is required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ─── Tesseract v7 recognize ─────────────────────────────────
    const {
      data: { text },
    } = await recognize(buffer, "eng");

    const extractedMedicines = parsePrescriptionText(text);

    if (extractedMedicines.length === 0) {
      return NextResponse.json(
        {
          error: "Could not detect any medicines in the image. Try a clearer photo.",
          rawText: text,
        },
        { status: 400 }
      );
    }

    // Return extracted data for user review — NOT saved yet
    return NextResponse.json({
      success: true,
      count: extractedMedicines.length,
      data: extractedMedicines,
      rawText: text,
    });
  } catch (error) {
    console.error("Tesseract API Error:", error);
    return NextResponse.json(
      { error: "Failed to process prescription via OCR" },
      { status: 500 }
    );
  }
}

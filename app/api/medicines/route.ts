import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Medicine from "@/lib/models/Medicine";
import DoseLog from "@/lib/models/DoseLog";

// ─── GET /api/medicines — list user's medicines ───────────────────────────────
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    const medicines = await Medicine.find({
      userId: payload.sub,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get today's dose logs to compute realtime status
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = await DoseLog.find({
      userId: payload.sub,
      scheduledDate: today,
    }).lean();

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const enriched = medicines.map((med) => {
      // For each scheduled time, check if there's a log
      const statuses: string[] = [];

      for (const time of med.times) {
        const [h, m] = time.split(":").map(Number);
        const timeMinutes = h * 60 + m;

        const log = todayLogs.find(
          (l) =>
            String(l.medicineId) === String(med._id) &&
            l.scheduledTime === time
        );

        if (log) {
          statuses.push(log.action);
        } else if (currentMinutes >= timeMinutes + 30) {
          statuses.push("missed");
        } else if (currentMinutes >= timeMinutes - 15) {
          statuses.push("due-soon");
        } else {
          statuses.push("upcoming");
        }
      }

      // Pick the most urgent status for the card
      let status: string = "upcoming";
      if (statuses.includes("due-soon")) status = "due-soon";
      if (statuses.includes("missed")) status = "missed";
      if (statuses.includes("snoozed")) status = "snoozed";
      if (statuses.every((s) => s === "taken")) status = "taken";

      return {
        ...med,
        _id: String(med._id),
        status,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    console.error("GET /api/medicines error:", err);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

// ─── POST /api/medicines — save medicines (from OCR review or manual) ─────────
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    const body = await req.json();
    const { medicines } = body as {
      medicines: {
        name: string;
        dosage: string;
        frequency: string;
        times: string[];
        instruction?: string;
        type?: string;
        source?: string;
        totalQuantity?: number;
      }[];
    };

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { error: "At least one medicine is required" },
        { status: 400 }
      );
    }

    const docs = medicines.map((m) => ({
      userId: payload.sub,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      times: m.times,
      instruction: m.instruction || "",
      type: m.type || "medicine",
      source: m.source || "manual",
      isActive: true,
      totalQuantity: m.totalQuantity || 30,
      remainingQuantity: m.totalQuantity || 30,
      missedStreakCount: 0,
    }));

    const saved = await Medicine.insertMany(docs);

    return NextResponse.json({
      success: true,
      count: saved.length,
      data: saved,
    });
  } catch (err) {
    console.error("POST /api/medicines error:", err);
    return NextResponse.json(
      { error: "Failed to save medicines" },
      { status: 500 }
    );
  }
}

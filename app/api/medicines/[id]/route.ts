import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Medicine from "@/lib/models/Medicine";

// ─── PATCH /api/medicines/[id] — update a medicine ───────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    const body = await req.json();

    const updated = await Medicine.findOneAndUpdate(
      { _id: id, userId: payload.sub },
      { $set: body },
      { new: true, lean: true }
    );

    if (!updated)
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/medicines/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/medicines/[id] — deactivate a medicine ──────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAuthToken(token);
    await dbConnect();

    await Medicine.findOneAndUpdate(
      { _id: id, userId: payload.sub },
      { $set: { isActive: false } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/medicines/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}

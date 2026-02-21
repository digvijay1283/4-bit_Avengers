import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    // syncIndexes pushes any schema-defined indexes to Atlas
    await User.syncIndexes();

    return NextResponse.json(
      { ok: true, message: "MongoDB connected and indexes synced." },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: "DB health check failed.", error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/model/[...path]
 *
 * Serves Live2D model files from the /model directory at the project root.
 * Handles JSON manifests, binary .moc3, textures, motions, physics etc.
 */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MIME: Record<string, string> = {
  ".json": "application/json",
  ".moc3": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".motion3.json": "application/json",
};

function getMime(filePath: string): string {
  if (filePath.endsWith(".motion3.json")) return "application/json";
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Security: reject path traversal attempts
  if (segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "model", ...segments);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": getMime(filePath),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

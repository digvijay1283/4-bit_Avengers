import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";

const RECOM_WEBHOOK_URL =
  process.env.RECOM_WEBHOOK_URL ??
  "https://synthomind.cloud/webhook-test/recom-system";

const RECOMMENDATION_KEYS = [
  "recommendations",
  "items",
  "data",
  "output",
  "result",
  "routineRecommendations",
  "routine_recommendations",
] as const;

type JsonObject = Record<string, unknown>;

function splitRecommendationString(value: string): string[] {
  const normalized = value.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  const numbered = normalized
    .split(/(?:^|\s)(?=\d+\.\s+)/)
    .map((part) => part.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (numbered.length > 1) {
    return numbered;
  }

  return [normalized];
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        if (item && typeof item === "object") {
          const itemObj = item as JsonObject;
          const itemText =
            itemObj.text ??
            itemObj.title ??
            itemObj.recommendation ??
            itemObj.item;
          if (typeof itemText === "string") {
            return itemText.trim();
          }
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return splitRecommendationString(value);
  }

  return [];
}

function extractFromObject(payload: JsonObject): string[] {
  for (const key of RECOMMENDATION_KEYS) {
    const directItems = toStringList(payload[key]);
    if (directItems.length > 0) {
      return directItems;
    }
  }

  for (const key of RECOMMENDATION_KEYS) {
    const nested = payload[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
      continue;
    }

    const nestedObj = nested as JsonObject;
    for (const nestedKey of RECOMMENDATION_KEYS) {
      const nestedItems = toStringList(nestedObj[nestedKey]);
      if (nestedItems.length > 0) {
        return nestedItems;
      }
    }
  }

  return [];
}

function getIncomingUserId(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const bodyObj = body as JsonObject;
  const incoming = bodyObj.userid ?? bodyObj.userId;
  if (typeof incoming !== "string") {
    return null;
  }

  const trimmed = incoming.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let requestBody: unknown = null;
    try {
      requestBody = await request.json();
    } catch {
      requestBody = null;
    }

    const userId = getIncomingUserId(requestBody) ?? user.userId;

    const webhookRes = await fetch(RECOM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid: userId, userId }),
      cache: "no-store",
    });

    const contentType = webhookRes.headers.get("content-type") ?? "";
    const webhookPayload = contentType.includes("application/json")
      ? await webhookRes.json()
      : await webhookRes.text();

    if (!webhookRes.ok) {
      const webhookMessage =
        webhookPayload &&
        typeof webhookPayload === "object" &&
        typeof (webhookPayload as JsonObject).message === "string"
          ? String((webhookPayload as JsonObject).message)
          : "Recommendation service unavailable.";

      return NextResponse.json(
        { ok: false, message: webhookMessage },
        { status: 502 }
      );
    }

    const directRecommendations = toStringList(webhookPayload);
    const recommendations =
      directRecommendations.length > 0
        ? directRecommendations
        : webhookPayload && typeof webhookPayload === "object"
          ? extractFromObject(webhookPayload as JsonObject)
          : [];

    return NextResponse.json({
      ok: true,
      recommendations,
      raw:
        recommendations.length === 0 &&
        webhookPayload &&
        typeof webhookPayload === "object"
          ? webhookPayload
          : null,
    });
  } catch (err) {
    console.error("Recommendations fetch error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch recommendations." },
      { status: 500 }
    );
  }
}

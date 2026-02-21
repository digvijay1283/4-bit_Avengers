/**
 * GET /api/chat/stream?sessionId=<uuid>
 *
 * Opens a Server-Sent Events (SSE) channel for a specific chat session.
 * The server uses this channel to PUSH proactive messages to the client
 * without the client needing to poll or ask.
 *
 * SSE protocol:  each event is `data: <json>\n\n`
 * Client listens via  `new EventSource("/api/chat/stream?sessionId=…")`
 */

import { getAuthUser } from "@/lib/rbac";
import {
  getOrCreateSession,
  registerSSEController,
  deregisterSSEController,
} from "@/lib/chatSessions";

// Prevent Next.js from statically caching this route
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const authUser = await getAuthUser();
  const resolvedUserId = authUser?.userId ?? "anonymous";
  const resolvedUserName = authUser?.fullName ?? "there";

  // ── Session ID from query param ──────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("sessionId is required", { status: 400 });
  }

  // Ensure the session exists (ChatWindow creates it on first POST, but the
  // SSE stream may open before the first message, so we pre-create it here)
  getOrCreateSession(sessionId, resolvedUserId, resolvedUserName);

  // ── Build the SSE ReadableStream ─────────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register so proactive timer can push through this controller
      registerSSEController(sessionId, controller);

      // Send an initial `connected` ping so the client knows the channel is live
      const ping = encoder.encode(
        `data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`
      );
      controller.enqueue(ping);

      // Clean up when the client closes the connection
      const cleanup = () => {
        deregisterSSEController(sessionId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable buffering on proxies / Nginx
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * In-memory chat session store.
 *
 * Responsibilities:
 *   1. Track per-session interaction count & user identity
 *   2. Hold the SSE ReadableStream controller per session so the server
 *      can push proactive messages to the correct client
 *   3. Schedule / cancel proactive message timers
 *
 * ⚠️  This module-level Map lives in the Node.js process.
 *     It works perfectly in `next dev` and on any single-instance Node server.
 *     For Vercel/Edge (serverless), swap to Redis or Upstash later.
 */

import { getRandomProactiveMessage, type ProactiveMessage } from "./proactiveMessages";

// Proactive message fires 5–10 seconds after the preceding bot response
const MIN_DELAY_MS = 5_000;
const MAX_DELAY_MS = 10_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatSession {
  sessionId: string;
  userId: string;
  userName: string;

  /** How many complete user→bot exchanges have happened */
  interactionCount: number;

  /** Pending proactive timer handle (null = no timer pending) */
  pendingTimerId: ReturnType<typeof setTimeout> | null;

  /**
   * SSE stream controller.  Populated once the client opens the SSE stream.
   * null means the client hasn't connected or has disconnected.
   */
  sseController: ReadableStreamDefaultController<Uint8Array> | null;

  /** IDs of proactive messages already sent — used to avoid repetition */
  sentProactiveIds: string[];

  /** Unix ms of the last user message — used for the corner-case guard */
  userLastActiveAt: number;

  /** True once a proactive message is sent; reset on next user message */
  waitingForUserAfterProactive: boolean;
}

// ── Session Map ──────────────────────────────────────────────────────────────

const sessions = new Map<string, ChatSession>();

// ── Public API ───────────────────────────────────────────────────────────────

export function getOrCreateSession(
  sessionId: string,
  userId: string,
  userName: string
): ChatSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      userId,
      userName,
      interactionCount: 0,
      pendingTimerId: null,
      sseController: null,
      sentProactiveIds: [],
      userLastActiveAt: Date.now(),
      waitingForUserAfterProactive: false,
    });
  }
  return sessions.get(sessionId)!;
}

export function getSession(sessionId: string): ChatSession | undefined {
  return sessions.get(sessionId);
}

/** Register the SSE controller once the client opens the stream */
export function registerSSEController(
  sessionId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.sseController = controller;
  }
}

/** Deregister SSE controller (client disconnected) */
export function deregisterSSEController(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.sseController = null;
    // Also cancel any pending timer since there's nobody to push to
    cancelProactiveTimer(sessionId);
  }
}

/**
 * Cancel a pending proactive timer.
 * Called immediately when a user message arrives (corner-case prevention).
 */
export function cancelProactiveTimer(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session || session.pendingTimerId === null) return;
  clearTimeout(session.pendingTimerId);
  session.pendingTimerId = null;
}

/**
 * Schedule a proactive push after a random 5–10 s delay.
 * Won't schedule if:
 *   - session doesn't exist
 *   - a timer is already pending
 *   - there's no live SSE controller
 *   - we're still waiting for user reply after a previous proactive push
 */
export function scheduleProactiveMessage(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (session.pendingTimerId !== null) return; // already scheduled
  if (!session.sseController) return; // nobody listening
  if (session.waitingForUserAfterProactive) return;

  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

  session.pendingTimerId = setTimeout(() => {
    // Clear reference BEFORE pushing so any in-flight cancelProactiveTimer
    // from a concurrent user message has already or will soon clear it cleanly
    session.pendingTimerId = null;

    // If controller went away while waiting, abort silently
    if (!session.sseController) return;
    if (session.waitingForUserAfterProactive) return;

    const msg = getRandomProactiveMessage(session.sentProactiveIds);

    // Track to avoid immediate repetition (bounded window of 6)
    session.sentProactiveIds.push(msg.id);
    if (session.sentProactiveIds.length > 6) session.sentProactiveIds.shift();

    pushSSEMessage(session.sseController, {
      type: "proactive",
      message: msg,
    });

    session.waitingForUserAfterProactive = true;
  }, delay);
}

// ── SSE helpers ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

/**
 * Push a single SSE `data:` frame to a live controller.
 * Format: `data: <json>\n\n`
 */
export function pushSSEMessage(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: Record<string, unknown>
): void {
  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  } catch {
    // Controller may have closed between the null check and enqueue — ignore
  }
}

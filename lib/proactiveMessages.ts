/**
 * Hardcoded proactive message bank.
 * Grouped by category — future RAG pipeline will replace this with
 * context-sensitive retrieval based on the user's health data.
 */

export interface ProactiveMessage {
  id: string;
  category:
    | "wellness"
    | "medication"
    | "activity"
    | "sleep"
    | "nutrition"
    | "mental_health";
  content: string;
}

export const PROACTIVE_MESSAGES: ProactiveMessage[] = [
  // ── Wellness ────────────────────────────────────────────────────────────
  {
    id: "w1",
    category: "wellness",
    content:
      "Just checking in — how are your energy levels today? Staying consistent with your health habits makes a real difference 💚",
  },
  {
    id: "w2",
    category: "wellness",
    content:
      "Are you drinking enough water today? Aim for at least 8 glasses — even mild dehydration can cause fatigue and headaches.",
  },

  // ── Medication ──────────────────────────────────────────────────────────
  {
    id: "m1",
    category: "medication",
    content:
      "Gentle reminder: have you taken your scheduled medications today? Consistency is key to their effectiveness 💊",
  },
  {
    id: "m2",
    category: "medication",
    content:
      "Pro tip: setting a daily alarm for your medications can improve adherence by up to 70%. Would you like help setting a reminder?",
  },

  // ── Activity ────────────────────────────────────────────────────────────
  {
    id: "a1",
    category: "activity",
    content:
      "Even a 10-minute walk boosts mood and reduces stress significantly. Have you managed to move around today? 🚶",
  },
  {
    id: "a2",
    category: "activity",
    content:
      "A quick stretch every hour prevents muscle tension and improves circulation. How's your posture right now? 🧍",
  },

  // ── Sleep ───────────────────────────────────────────────────────────────
  {
    id: "s1",
    category: "sleep",
    content:
      "Quality sleep is your body's #1 recovery tool. Are you getting 7–8 hours? Your immune system, mood, and focus all depend on it 🌙",
  },
  {
    id: "s2",
    category: "sleep",
    content:
      "Avoiding screens 30 minutes before bed significantly improves sleep depth. How have you been sleeping lately?",
  },

  // ── Nutrition ───────────────────────────────────────────────────────────
  {
    id: "n1",
    category: "nutrition",
    content:
      "Have you had a balanced meal today? Combining protein, fiber, and healthy fats helps keep your energy stable all day 🥗",
  },
  {
    id: "n2",
    category: "nutrition",
    content:
      "Eating slowly and mindfully improves digestion and prevents overeating. How's your appetite been lately?",
  },

  // ── Mental Health ───────────────────────────────────────────────────────
  {
    id: "mh1",
    category: "mental_health",
    content:
      "Taking 5 slow deep breaths activates your parasympathetic nervous system and reduces anxiety almost instantly. Give it a try 🧘",
  },
  {
    id: "mh2",
    category: "mental_health",
    content:
      "Mental wellness matters just as much as physical health. Is there anything on your mind today I can help you with?",
  },
];

/**
 * Pick a random proactive message, preferring ones not recently shown.
 * @param exclude  Array of message IDs to deprioritise (recently sent)
 */
export function getRandomProactiveMessage(
  exclude: string[] = []
): ProactiveMessage {
  const pool = PROACTIVE_MESSAGES.filter((m) => !exclude.includes(m.id));
  const source = pool.length > 0 ? pool : PROACTIVE_MESSAGES;
  return source[Math.floor(Math.random() * source.length)];
}

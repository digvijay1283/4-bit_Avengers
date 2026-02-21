export type NlpMedication = {
  name: string;
  dosage?: string;
  frequency?: string;
  instruction?: string;
};

export type ReportNlpResult = {
  summary: string;
  medications: NlpMedication[];
  abnormalFindings: string[];
  followUpActions: string[];
  severity: "low" | "medium" | "high";
  confidence: number;
};

const DOSAGE_REGEX =
  /(\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|ml|iu|units?|tabs?|tablets?|caps?|capsules?|drops?|puffs?))/i;
const FREQUENCY_REGEX =
  /\b(once\s+daily|twice\s+daily|thrice\s+daily|daily|weekly|every\s+\d+\s*hours?|morning|evening|night|bedtime|1-0-1|1-1-1|0-0-1|0-1-0)\b/i;
const MEDICINE_HINT_REGEX =
  /\b(tab|tablet|cap|capsule|syrup|suspension|injection|inj|drops?)\b/i;
const ABNORMAL_HINT_REGEX =
  /\b(high|low|elevated|abnormal|positive|deficient|borderline|critical|above\s+normal|below\s+normal|out\s+of\s+range)\b/i;
const FOLLOW_UP_HINT_REGEX =
  /\b(follow[\s-]?up|retest|repeat|review|consult|monitor|after\s+\d+\s+(?:days?|weeks?|months?))\b/i;

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function cleanMedicineName(raw: string): string {
  const cleaned = raw
    .replace(/^\d+[\).\s-]*/, "")
    .replace(/\b(tab|tablet|cap|capsule|syrup|suspension|injection|inj|drops?)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseMedications(lines: string[]): NlpMedication[] {
  const medications: NlpMedication[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const dosage = line.match(DOSAGE_REGEX)?.[1]?.trim();
    const frequency = line.match(FREQUENCY_REGEX)?.[1]?.trim();
    const hasMedicineHint = MEDICINE_HINT_REGEX.test(line);

    if (!dosage && !frequency && !hasMedicineHint) {
      continue;
    }

    const nameCandidate = cleanMedicineName(
      line
        .replace(DOSAGE_REGEX, " ")
        .replace(FREQUENCY_REGEX, " ")
        .replace(/\b(before|after|with|without|food|meal|breakfast|lunch|dinner|empty\s+stomach)\b/gi, " ")
    );

    if (nameCandidate.length < 2) {
      continue;
    }

    const dedupeKey = `${nameCandidate.toLowerCase()}|${dosage ?? ""}|${frequency ?? ""}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const instruction = line.match(
      /\b(before|after|with|without)\s+(?:food|meal|breakfast|lunch|dinner|water|milk)\b/i
    )?.[0];

    medications.push({
      name: nameCandidate,
      dosage,
      frequency,
      instruction: instruction?.trim(),
    });

    if (medications.length >= 8) {
      break;
    }
  }

  return medications;
}

function parseAbnormalFindings(lines: string[]): string[] {
  const findings: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!ABNORMAL_HINT_REGEX.test(line)) {
      continue;
    }

    const normalized = normalizeLine(line);
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    findings.push(normalized);

    if (findings.length >= 8) {
      break;
    }
  }

  return findings;
}

function parseFollowUpActions(lines: string[]): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!FOLLOW_UP_HINT_REGEX.test(line)) {
      continue;
    }

    const normalized = normalizeLine(line);
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    actions.push(normalized);

    if (actions.length >= 5) {
      break;
    }
  }

  return actions;
}

function getSeverity(abnormalCount: number): ReportNlpResult["severity"] {
  if (abnormalCount >= 3) {
    return "high";
  }
  if (abnormalCount >= 1) {
    return "medium";
  }
  return "low";
}

function buildSummary(medications: NlpMedication[], abnormalFindings: string[]): string {
  if (abnormalFindings.length > 0) {
    return `${abnormalFindings.length} abnormal or attention-worthy finding(s) detected with ${medications.length} medicine instruction(s).`;
  }
  if (medications.length > 0) {
    return `No clear abnormal markers detected. Extracted ${medications.length} medicine instruction(s) from report text.`;
  }
  return "Clinical text extracted. No clear medicine instructions or abnormal markers detected by NLP.";
}

function estimateConfidence(
  rawText: string,
  medications: NlpMedication[],
  abnormalFindings: string[]
): number {
  const tokenCount = rawText.split(/\s+/).filter(Boolean).length;
  let confidence = tokenCount >= 120 ? 0.84 : tokenCount >= 60 ? 0.76 : 0.66;
  confidence += Math.min(0.08, medications.length * 0.01);
  confidence += Math.min(0.08, abnormalFindings.length * 0.02);
  return Math.max(0.5, Math.min(0.95, Number(confidence.toFixed(2))));
}

export function analyzeReportTextWithNlp(rawText: string): ReportNlpResult {
  const normalizedText = rawText.replace(/\r/g, "");
  const lines = normalizedText
    .split("\n")
    .map(normalizeLine)
    .filter((line) => line.length > 0);

  const medications = parseMedications(lines);
  const abnormalFindings = parseAbnormalFindings(lines);
  const followUpActions = parseFollowUpActions(lines);

  if (abnormalFindings.length > 0 && followUpActions.length === 0) {
    followUpActions.push(
      "Review abnormal values with your doctor and plan follow-up testing if needed."
    );
  }
  if (medications.length > 0 && followUpActions.length < 2) {
    followUpActions.push(
      "Confirm dosage and schedule with your doctor before relying on auto-generated reminders."
    );
  }
  if (followUpActions.length === 0) {
    followUpActions.push("Continue routine monitoring and keep reports for trend comparison.");
  }

  const severity = getSeverity(abnormalFindings.length);
  const summary = buildSummary(medications, abnormalFindings);
  const confidence = estimateConfidence(rawText, medications, abnormalFindings);

  return {
    summary,
    medications,
    abnormalFindings,
    followUpActions,
    severity,
    confidence,
  };
}

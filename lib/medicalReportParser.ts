import {
  analyzeReportTextWithNlp,
  type ReportNlpResult,
} from "@/lib/reportNlp";

export type ExtractedMedicalInfo = {
  hospitalName?: string;
  reportType?: string;
  visit: {
    doctorName?: string;
    specialization?: string;
    visitDate?: string;
  };
  patient: {
    fullName?: string;
    birthDate?: string;
    medNumber?: string;
    ihi?: string;
    phone?: string;
    email?: string;
  };
  sections: {
    assessment?: string;
    diagnosis?: string;
    prescription?: string;
  };
  keyInsights: string[];
  nlp?: ReportNlpResult;
};

function matchFirst(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.trim();
}

function extractSection(text: string, startLabel: string, endLabels: string[]): string | undefined {
  const normalized = text.replace(/\r/g, "");
  const startRegex = new RegExp(`${startLabel}\\s*\\n`, "i");
  const startMatch = normalized.match(startRegex);

  if (!startMatch || startMatch.index === undefined) return undefined;

  const startIndex = startMatch.index + startMatch[0].length;
  const remaining = normalized.slice(startIndex);

  let endIndex = remaining.length;

  for (const label of endLabels) {
    const endRegex = new RegExp(`\\n${label}\\s*\\n`, "i");
    const endMatch = remaining.match(endRegex);
    if (endMatch && endMatch.index !== undefined) {
      endIndex = Math.min(endIndex, endMatch.index);
    }
  }

  const sectionText = remaining.slice(0, endIndex).trim();
  return sectionText || undefined;
}

export function parseMedicalReportText(rawText: string): ExtractedMedicalInfo {
  const text = rawText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const nlp = analyzeReportTextWithNlp(text);

  const hospitalName =
    matchFirst(text, /^([^\n]*Hospital[^\n]*)/im) ??
    matchFirst(text, /^([^\n]*Clinic[^\n]*)/im);

  const reportType = matchFirst(text, /\b(MEDICAL\s+REPORT|LAB\s+REPORT|DISCHARGE\s+SUMMARY)\b/i);

  const doctorName = matchFirst(text, /Doctor'?s\s*Name\s*:\s*([^\n]+)/i);
  const specialization = matchFirst(text, /Specialization\s*:\s*([^\n]+)/i);
  const visitDate = matchFirst(text, /Visit\s*Date\s*:\s*([^\n]+)/i);

  const fullName = matchFirst(text, /Full\s*Name\s*:\s*([^\n]+)/i);
  const birthDate = matchFirst(text, /Birth\s*Date\s*:\s*([^\n]+)/i);
  const medNumber = matchFirst(text, /Med\.?\s*Number\s*:\s*([^\n]+)/i);
  const ihi = matchFirst(text, /IHI\s*:\s*([^\n]+)/i);
  const phone = matchFirst(text, /Phone\s*:\s*([^\n]+)/i);
  const email = matchFirst(text, /Email\s*:\s*([^\n\s]+@[^\n\s]+)/i);

  const assessment = extractSection(text, "Assessment", ["Diagnosis", "Prescription", "Conclusion"]);
  const diagnosis = extractSection(text, "Diagnosis", ["Prescription", "Conclusion"]);
  const prescription = extractSection(text, "Prescription", ["Footer", "For inquiries", "Contact"]);

  const keyInsights: string[] = [];

  if (assessment) {
    if (/no\s+immediate\s+concerns|within\s+normal\s+ranges/i.test(assessment)) {
      keyInsights.push("Assessment indicates stable vitals with no immediate concerns.");
    }
    if (/stress|anxiety|sleep\s+deprivation/i.test(assessment)) {
      keyInsights.push("Assessment suggests possible mental-wellness stress indicators.");
    }
  }

  if (diagnosis) {
    if (/no\s+specific\s+medical\s+conditions|healthy\s+status/i.test(diagnosis)) {
      keyInsights.push("Diagnosis does not indicate major acute medical conditions.");
    } else {
      keyInsights.push("Diagnosis section contains condition-specific findings and should be reviewed.");
    }
  }

  if (prescription) {
    if (/no\s+prescription\s+is\s+necessary|no\s+medication\s+is\s+prescribed/i.test(prescription)) {
      keyInsights.push("No active prescription detected for this report.");
    } else {
      keyInsights.push("Prescription instructions detected; medicine scheduling can be generated.");
    }
  }

  if (nlp.abnormalFindings.length > 0) {
    keyInsights.push(
      `NLP flagged ${nlp.abnormalFindings.length} attention-worthy finding(s) for follow-up.`
    );
  }

  if (nlp.medications.length > 0) {
    keyInsights.push(
      `NLP extracted ${nlp.medications.length} medicine instruction(s) from the report text.`
    );
  }

  const uniqueKeyInsights = Array.from(new Set(keyInsights));

  return {
    hospitalName,
    reportType,
    visit: {
      doctorName,
      specialization,
      visitDate,
    },
    patient: {
      fullName,
      birthDate,
      medNumber,
      ihi,
      phone,
      email,
    },
    sections: {
      assessment,
      diagnosis,
      prescription,
    },
    keyInsights: uniqueKeyInsights,
    nlp,
  };
}

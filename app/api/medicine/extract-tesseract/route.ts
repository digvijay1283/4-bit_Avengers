import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { dbConnect } from '@/lib/mongodb';
import Medicine from '@/lib/models/Medicine';

function parsePrescriptionText(rawText: string) {
  const lines = rawText
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 2);

  const stopWords = new Set([
    'rx',
    'dr',
    'doctor',
    'hospital',
    'clinic',
    'patient',
    'name',
    'age',
    'date',
    'diagnosis',
    'advice',
    'signature',
    'phone',
    'tablet',
    'tab',
    'capsule',
    'cap',
    'syrup',
    'ml',
    'mg',
  ]);

  const medicines: {
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    type: string;
    source: string;
  }[] = [];

  const dosageRegex = /(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu)|\d+\s*(?:tab|tablet|cap|capsule))/i;
  const frequencyRegex = /(\d\s*-\s*\d\s*-\s*\d|twice|thrice|daily|once|morning|night|od|bd|tid|qid|hs|sos)/i;

  const extractMedicineName = (line: string, dosageMatch?: string, freqMatch?: string) => {
    const cleaned = line
      .replace(dosageMatch || '', '')
      .replace(freqMatch || '', '')
      .replace(/\b(before|after|with|meals?|food|breakfast|lunch|dinner)\b/gi, '')
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return null;

    const tokens = cleaned
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 1);

    const likely = tokens.filter((token) => !stopWords.has(token.toLowerCase()));
    const name = likely.join(' ').trim();

    if (name.length < 3) return null;
    if (!/[a-zA-Z]/.test(name)) return null;

    return name;
  };

  const seen = new Set<string>();

  for (const line of lines) {
    const dosageMatch = line.match(dosageRegex);
    const freqMatch = line.match(frequencyRegex);

    const hasMedicationSignal =
      Boolean(dosageMatch) ||
      Boolean(freqMatch) ||
      /\b(tab|tablet|cap|capsule|syrup|drop|injection)\b/i.test(line);

    if (!hasMedicationSignal) {
      continue;
    }

    const name = extractMedicineName(line, dosageMatch?.[0], freqMatch?.[0]);
    if (!name) {
      continue;
    }

    const dedupeKey = name.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);

    const normalizedFrequency = freqMatch
      ? freqMatch[0].replace(/\s+/g, '').toLowerCase()
      : 'daily';

    const times =
      normalizedFrequency.includes('twice') ||
      normalizedFrequency === '1-0-1' ||
      normalizedFrequency === 'bd'
        ? ["09:00", "21:00"]
        : ["09:00"];

    medicines.push({
      name,
      dosage: dosageMatch ? dosageMatch[0] : 'As prescribed',
      frequency: freqMatch ? freqMatch[0] : 'Daily',
      times,
      type: 'medicine',
      source: 'ocr_tesseract'
    });
  }

  if (medicines.length === 0) {
    for (const line of lines) {
      const candidate = extractMedicineName(line);
      if (!candidate) continue;

      const key = candidate.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      medicines.push({
        name: candidate,
        dosage: 'As prescribed',
        frequency: 'Daily',
        times: ["09:00"],
        type: 'medicine',
        source: 'ocr_tesseract'
      });

      if (medicines.length >= 3) break;
    }
  }

  return medicines;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and User ID are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m),
    });

    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    const extractedData = parsePrescriptionText(text);

    if (extractedData.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not detect any medicines in the image. Try a clearer image with medicine names and dosage visible.',
          rawText: text,
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const docsToInsert = extractedData.map((item) => ({
      ...item,
      userId,
      status: 'pending'
    }));

    const savedMedicines = await Medicine.insertMany(docsToInsert);

    return NextResponse.json({
      success: true,
      count: savedMedicines.length,
      data: savedMedicines,
      rawText: text
    });

  } catch (error) {
    console.error("Tesseract API Error:", error);
    return NextResponse.json({ error: 'Failed to process prescription via OCR' }, { status: 500 });
  }
}

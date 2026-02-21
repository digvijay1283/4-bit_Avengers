import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import dbConnect from '@/lib/mongodb';
import Medicine from '@/lib/models/Medicine';

function parsePrescriptionText(rawText: string) {
  const lines = rawText.split('\n').filter(line => line.trim().length > 3);
  const medicines: {
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    type: string;
    source: string;
  }[] = [];

  const dosageRegex = /(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|IU))/i;
  const frequencyRegex = /(\d-\d-\d|twice|thrice|daily|once|morning|night)/i;

  for (const line of lines) {
    const dosageMatch = line.match(dosageRegex);
    const freqMatch = line.match(frequencyRegex);

    if (dosageMatch || freqMatch) {
      let name = line.replace(dosageMatch?.[0] || '', '')
                     .replace(freqMatch?.[0] || '', '')
                     .trim()
                     .replace(/[^a-zA-Z0-9\s]/g, '');

      if (name.length > 2) {
        medicines.push({
          name: name,
          dosage: dosageMatch ? dosageMatch[0] : 'As prescribed',
          frequency: freqMatch ? freqMatch[0] : 'Daily',
          times: freqMatch?.[0].includes('twice') || freqMatch?.[0] === '1-0-1' ? ["09:00", "21:00"] : ["09:00"],
          type: 'medicine',
          source: 'ocr_tesseract'
        });
      }
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
      return NextResponse.json({ error: 'Could not detect any medicines in the image.' }, { status: 400 });
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

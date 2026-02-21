import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  times: [{ type: String }],
  type: { type: String, enum: ['medicine', 'test'], default: 'medicine' },
  status: { type: String, enum: ['pending', 'taken', 'skipped'], default: 'pending' },
  source: { type: String, enum: ['manual', 'ocr', 'ocr_tesseract'], default: 'ocr_tesseract' },
}, { timestamps: true });

export default mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);

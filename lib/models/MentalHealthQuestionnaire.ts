import mongoose from "mongoose";

/**
 * Each answer is stored as a number 0–4, mapping to:
 * 0 = Never, 1 = Rarely, 2 = Sometimes, 3 = Often, 4 = Almost Always
 */

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    value: { type: Number, required: true, min: 0, max: 4 },
  },
  { _id: false }
);

const MentalHealthQuestionnaireSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    answers: { type: [AnswerSchema], required: true },
    /** Optional free-text description from the user */
    description: { type: String, default: "" },
    /** Optional uploaded PDF file name (stored reference) */
    pdfFileName: { type: String, default: "" },
    /** Computed group scores */
    scores: {
      anxiety: { type: Number, default: 0 },
      depression: { type: Number, default: 0 },
      trauma: { type: Number, default: 0 },
      severeMood: { type: Number, default: 0 },
      crisis: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true, collection: "mental_health_questionnaires" }
);

// One questionnaire per user (latest response)
MentalHealthQuestionnaireSchema.index(
  { userId: 1 },
  { unique: true, name: "uq_mhq_userId" }
);

export default mongoose.models.MentalHealthQuestionnaire ||
  mongoose.model("MentalHealthQuestionnaire", MentalHealthQuestionnaireSchema);

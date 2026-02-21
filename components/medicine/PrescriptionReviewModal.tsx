"use client";

import { useState } from "react";
import { X, Plus, Trash2, Clock, Pill, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { ExtractedMedicine } from "@/types/medicine";

interface PrescriptionReviewModalProps {
  extracted: ExtractedMedicine[];
  rawText: string;
  mode?: "ocr" | "manual";
  onClose: () => void;
  onSaved: () => void;
}

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Thrice daily",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Weekly",
];

export default function PrescriptionReviewModal({
  extracted,
  rawText,
  mode = "ocr",
  onClose,
  onSaved,
}: PrescriptionReviewModalProps) {
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>(extracted);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const updateField = (
    idx: number,
    field: keyof ExtractedMedicine,
    value: string | string[]
  ) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const addTime = (idx: number) => {
    setMedicines((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, times: [...m.times, "12:00"] } : m
      )
    );
  };

  const removeTime = (medIdx: number, timeIdx: number) => {
    setMedicines((prev) =>
      prev.map((m, i) =>
        i === medIdx
          ? { ...m, times: m.times.filter((_, ti) => ti !== timeIdx) }
          : m
      )
    );
  };

  const updateTime = (medIdx: number, timeIdx: number, value: string) => {
    setMedicines((prev) =>
      prev.map((m, i) =>
        i === medIdx
          ? {
              ...m,
              times: m.times.map((t, ti) => (ti === timeIdx ? value : t)),
            }
          : m
      )
    );
  };

  const removeMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBlankMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        times: ["09:00"],
        instruction: "",
      },
    ]);
  };

  const handleSave = async () => {
    // Validate
    const valid = medicines.filter((m) => m.name.trim() && m.times.length > 0);
    if (valid.length === 0) {
      toast.error("Add at least one medicine with a name and time.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: valid.map((m) => ({
            ...m,
            source: mode === "manual" ? "manual" : "ocr",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Saved ${data.count} medicine${data.count > 1 ? "s" : ""}!`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save medicines");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {mode === "manual" ? "Add Medicines" : "Review Extracted Medicines"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "manual"
                ? `Add and customize ${medicines.length} medicine${medicines.length !== 1 ? "s" : ""} before saving`
                : `${medicines.length} medicine${medicines.length !== 1 ? "s" : ""} detected — edit before saving`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {medicines.map((med, idx) => (
            <div
              key={idx}
              className="border border-gray-200 bg-white rounded-2xl p-5 space-y-4 relative group shadow-sm"
            >
              {/* Remove button */}
              <button
                onClick={() => removeMedicine(idx)}
                className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Medicine #{idx + 1}
              </div>

              {/* Name + Dosage row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Name
                  </label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateField(idx, "name", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. Metformin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateField(idx, "dosage", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. 500mg"
                  />
                </div>
              </div>

              {/* Frequency + Instruction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Frequency
                  </label>
                  <select
                    value={
                      FREQUENCY_OPTIONS.find(
                        (o) =>
                          o.toLowerCase() === med.frequency.toLowerCase()
                      ) || ""
                    }
                    onChange={(e) =>
                      updateField(idx, "frequency", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {FREQUENCY_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={med.instruction}
                    onChange={(e) =>
                      updateField(idx, "instruction", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. After breakfast"
                  />
                </div>
              </div>

              {/* Times */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">
                  Reminder Times
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {med.times.map((t, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center gap-1 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={t}
                        onChange={(e) =>
                          updateTime(idx, tIdx, e.target.value)
                        }
                        className="text-sm border-none bg-transparent outline-none w-20"
                      />
                      {med.times.length > 1 && (
                        <button
                          onClick={() => removeTime(idx, tIdx)}
                          className="text-red-400 hover:text-red-600 ml-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addTime(idx)}
                    className="text-xs text-primary font-semibold hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
                  >
                    + Add time
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add another */}
          <button
            onClick={addBlankMedicine}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Medicine
          </button>

          {/* Raw OCR text toggle (only for OCR mode) */}
          {mode === "ocr" && rawText.trim().length > 0 && (
            <>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                {showRaw ? "Hide" : "Show"} raw OCR text
              </button>
              {showRaw && (
                <pre className="text-xs bg-slate-50 p-4 rounded-xl border border-gray-200 whitespace-pre-wrap text-slate-600 max-h-40 overflow-y-auto">
                  {rawText}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || medicines.length === 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save {medicines.length} Medicine{medicines.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

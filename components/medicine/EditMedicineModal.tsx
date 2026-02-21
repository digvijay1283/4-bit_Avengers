"use client";

import { useState } from "react";
import { X, Save, Clock, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import type { Medicine } from "@/types/medicine";

interface EditMedicineModalProps {
  medicine: Medicine;
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

export default function EditMedicineModal({
  medicine,
  onClose,
  onSaved,
}: EditMedicineModalProps) {
  const [form, setForm] = useState({
    name: medicine.name,
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    instruction: medicine.instruction,
    times: medicine.times.length ? medicine.times : ["09:00"],
  });
  const [saving, setSaving] = useState(false);

  const addTime = () => {
    setForm((prev) => ({ ...prev, times: [...prev.times, "12:00"] }));
  };

  const removeTime = (index: number) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const updateTime = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.map((t, i) => (i === index ? value : t)),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    if (form.times.length === 0) {
      toast.error("Add at least one reminder time");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/medicines/${medicine._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          dosage: form.dosage.trim(),
          frequency: form.frequency,
          instruction: form.instruction.trim(),
          times: form.times,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update medicine");

      toast.success("Medicine updated");
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Could not update medicine");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Medicine
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Update medicine name, timings, dosage and instructions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
                value={form.dosage}
                onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="e.g. 500mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm((p) => ({ ...p, frequency: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
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
                value={form.instruction}
                onChange={(e) =>
                  setForm((p) => ({ ...p, instruction: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="e.g. After breakfast"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">
              Reminder Times
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {form.times.map((time, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    className="text-sm border-none bg-transparent outline-none w-20"
                  />
                  {form.times.length > 1 && (
                    <button
                      onClick={() => removeTime(index)}
                      className="text-red-400 hover:text-red-600 ml-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTime}
                className="text-xs text-primary font-semibold hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
              >
                + Add time
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

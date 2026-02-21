"use client";

import { useState, useRef } from "react";
import { Plus, Camera, Keyboard } from "lucide-react";
import toast from "react-hot-toast";
import PrescriptionReviewModal from "@/components/medicine/PrescriptionReviewModal";
import type { ExtractedMedicine } from "@/types/medicine";

interface AddMedicineFABProps {
  /** Optional callback to refresh the parent page data after a successful save */
  onRefresh?: () => void;
}

export default function AddMedicineFAB({ onRefresh }: AddMedicineFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewData, setReviewData] = useState<{
    extracted: ExtractedMedicine[];
    rawText: string;
  } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── OCR upload handler ─────────────────────────────────────── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsOpen(false);
    toast.loading("Reading prescription with AI...", { id: "ocr-toast" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/medicine/extract-tesseract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(`Detected ${data.count} medicine${data.count > 1 ? "s" : ""}! Review below.`, {
        id: "ocr-toast",
      });

      // Open review modal instead of auto-saving
      setReviewData({
        extracted: data.data,
        rawText: data.rawText,
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not read prescription. Please try a clearer photo.", {
        id: "ocr-toast",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  /* ── Manual add handler ─────────────────────────────────────── */
  const handleManualAdd = () => {
    setIsOpen(false);
    setShowManualModal(true);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed-dial options */}
      {isOpen && (
        <div className="fixed bottom-28 right-5 z-40 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 flex flex-col gap-2">
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Camera className="h-4 w-4 text-primary" />
            Scan Prescription
          </button>

          <button
            onClick={handleManualAdd}
            className="w-full flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Keyboard className="h-4 w-4 text-primary" />
            Add Manually
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isUploading}
        className={`fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isUploading
            ? "bg-gray-400 cursor-wait"
            : "bg-primary hover:bg-primary/90 active:scale-95"
        }`}
      >
        {isUploading ? (
          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <Plus
            className={`h-6 w-6 text-white transition-transform ${
              isOpen ? "rotate-45" : ""
            }`}
          />
        )}
      </button>

      {/* Prescription Review Modal (after OCR) */}
      {reviewData && (
        <PrescriptionReviewModal
          extracted={reviewData.extracted}
          rawText={reviewData.rawText}
          mode="ocr"
          onClose={() => setReviewData(null)}
          onSaved={() => {
            setReviewData(null);
            onRefresh?.();
          }}
        />
      )}

      {/* Manual Add Modal — reuse Review modal with blank entry */}
      {showManualModal && (
        <PrescriptionReviewModal
          extracted={[
            {
              name: "",
              dosage: "",
              frequency: "Once daily",
              times: ["09:00"],
              instruction: "",
            },
          ]}
          rawText=""
          mode="manual"
          onClose={() => setShowManualModal(false)}
          onSaved={() => {
            setShowManualModal(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}

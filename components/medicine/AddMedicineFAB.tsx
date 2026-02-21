"use client";

import { useState, useRef } from "react";
import { Plus, Camera, Keyboard } from "lucide-react";
import toast from "react-hot-toast";

interface AddMedicineFABProps {
  /** Current user id to tag medicines in the DB */
  userId: string;
  /** Optional callback to refresh the parent page data after a successful upload */
  refreshDashboardData?: () => void;
}

export default function AddMedicineFAB({
  userId,
  refreshDashboardData,
}: AddMedicineFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      formData.append("userId", userId);

      const response = await fetch("/api/medicine/extract-tesseract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(`Successfully added ${data.count} reminders!`, {
        id: "ocr-toast",
      });

      if (typeof refreshDashboardData === "function") refreshDashboardData();
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
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed-dial options */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 items-end">
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 bg-white shadow-lg rounded-full pl-4 pr-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
          >
            <Camera className="h-4 w-4 text-primary" />
            Scan Prescription
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              toast("Manual entry coming soon!", { icon: "✏️" });
            }}
            className="flex items-center gap-2 bg-white shadow-lg rounded-full pl-4 pr-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors"
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
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
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
    </>
  );
}

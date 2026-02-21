"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  File,
} from "lucide-react";
import Link from "next/link";

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export default function UploadContent() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [ocrResult, setOcrResult] = useState("");

  const acceptedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
  ];

  function handleFileSelect(f: File) {
    if (!acceptedTypes.includes(f.type)) {
      setErrorMsg("Please upload a PNG, JPEG, WebP, or PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("File size must be under 10 MB.");
      return;
    }
    setErrorMsg("");
    setFile(f);
    setState("idle");
    setOcrResult("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  async function handleUpload() {
    if (!file) return;
    setState("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      setState("processing");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setOcrResult(data.text ?? "No text extracted.");
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }

  function reset() {
    setFile(null);
    setState("idle");
    setOcrResult("");
    setErrorMsg("");
  }

  const fileIcon = file?.type.startsWith("image/") ? ImageIcon : File;
  const FileIcon = fileIcon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
          <Upload className="h-7 w-7 text-primary" />
          Upload Medical Report
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Upload a lab report or prescription image. Our AI will extract and
          summarise the content.
        </p>
      </div>

      {/* Drop zone */}
      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-soft-mint/20"
              : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-primary/50"
          }`}
        >
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Camera className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
            <p className="text-sm font-medium text-[#64748B]">
              Drag & drop a file here, or{" "}
              <span className="text-primary font-semibold">browse</span>
            </p>
            <p className="text-xs text-[#94A3B8] mt-2">
              PNG, JPEG, WebP, or PDF — up to 10 MB
            </p>
          </label>
        </div>
      )}

      {/* Selected file preview */}
      {file && state !== "done" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button onClick={reset} className="text-[#94A3B8] hover:text-red-500 transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={state === "uploading" || state === "processing"}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#0F4D2A] disabled:opacity-50 transition"
          >
            {state === "uploading" || state === "processing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {state === "uploading" ? "Uploading…" : "Extracting text…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Extract
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Success / OCR Result */}
      {state === "done" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Report processed successfully!
              </p>
              <p className="text-xs text-green-700 mt-1">
                The extracted text is shown below.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Extracted Content
            </h2>
            <div className="rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] p-4 text-sm text-[#334155] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {ocrResult}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:border-primary hover:text-primary transition"
            >
              Upload Another
            </button>
            <Link
              href="/reports"
              className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white text-center hover:bg-[#0F4D2A] transition"
            >
              View Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, QrCode, Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ScanState = "idle" | "scanning" | "processing" | "error";

export default function QRScannerCard() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualId, setManualId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up camera on unmount or stop
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  function handleScanResult(rawValue: string) {
    stopCamera();
    setState("processing");
    const trimmed = rawValue.trim();

    // If it's a share token from the patient QR, go to shared view
    if (trimmed.startsWith("share:")) {
      const token = trimmed.slice("share:".length);
      router.push(`/doctor/shared/${encodeURIComponent(token)}`);
    } else if (trimmed.startsWith("pid-")) {
      // Manual entry support: short patient share ID
      router.push(`/doctor/shared/${encodeURIComponent(trimmed)}`);
    } else {
      // Legacy: treat as patient ID
      router.push(`/doctor/patient/${encodeURIComponent(trimmed)}`);
    }
  }

  async function startScanning() {
    setErrorMsg("");
    setState("scanning");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use BarcodeDetector if available (Chrome 83+, Edge, Android)
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleScanResult(barcodes[0].rawValue);
            }
          } catch {
            /* frame not ready */
          }
        }, 400);
      } else {
        // Fallback: show camera feed but ask for manual input
        setErrorMsg(
          "QR auto-detect not supported in this browser. Use manual Patient ID / Share ID instead."
        );
      }
    } catch (err) {
      setState("error");
      setErrorMsg(
        "Camera access denied. Please allow camera permissions or enter the Patient ID / Share ID manually."
      );
    }
  }

  function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualId.trim();
    if (!trimmed) return;
    handleScanResult(trimmed);
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-[#0F172A]">Scan Patient QR</h3>
        </div>
        {state === "scanning" && (
          <button
            onClick={() => {
              stopCamera();
              setState("idle");
            }}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Stop
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Camera viewport */}
        {(state === "scanning" || state === "processing") && (
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            {/* Scanner overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-2xl border-2 border-white/60">
                <div className="absolute top-0 left-0 h-6 w-6 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-6 w-6 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-r-4 border-b-4 border-primary rounded-br-lg" />
              </div>
            </div>
            {state === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        )}

        {/* Idle: show scan button */}
        {state === "idle" && (
          <button
            onClick={startScanning}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-10 text-[#64748B] hover:border-primary hover:text-primary hover:bg-soft-mint/20 transition-all"
          >
            <Camera className="h-6 w-6" />
            <span className="font-medium text-sm">
              Tap to open camera & scan QR
            </span>
          </button>
        )}

        {/* Error state */}
        {state === "error" && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Info for scanning state */}
        {state === "scanning" && errorMsg && (
          <p className="text-xs text-amber-600 text-center">{errorMsg}</p>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[#94A3B8]">
              or enter Patient ID / Share ID
            </span>
          </div>
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Patient ID or Share ID (e.g. pid-micxk2ab7f)"
            className="flex-1 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-primary focus:ring-2 focus:ring-[#D1FAE5]"
          />
          <button
            type="submit"
            disabled={!manualId.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-[#0F4D2A] disabled:opacity-40 transition"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

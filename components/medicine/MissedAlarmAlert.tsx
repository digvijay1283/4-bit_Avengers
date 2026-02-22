"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react";

interface MissedAlarmAlertProps {
  alerts: {
    medicineId: string;
    medicineName: string;
    missedCount: number;
    guardianCalled?: boolean;
    guardianName?: string;
    callingInProgress?: boolean;
    callError?: string;
  }[];
  onDismiss: (medicineId: string) => void;
}

export default function MissedAlarmAlert({
  alerts,
  onDismiss,
}: MissedAlarmAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.medicineId));
  if (visible.length === 0) return null;

  const handleDismiss = (medicineId: string) => {
    setDismissed((prev) => new Set(prev).add(medicineId));
    onDismiss(medicineId);
  };

  return (
    <div className="fixed inset-x-0 bottom-32 z-[55] flex flex-col items-center gap-3 px-4 pointer-events-none">
      {visible.map((alert) => (
        <div
          key={alert.medicineId}
          className="pointer-events-auto bg-red-50 border-2 border-red-300 rounded-2xl p-5 max-w-md w-full shadow-xl animate-in slide-in-from-bottom fade-in duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-sm">
                Repeated Missed Doses!
              </h4>
              <p className="text-red-700 text-sm mt-1">
                You&apos;ve missed{" "}
                <span className="font-bold">{alert.medicineName}</span>{" "}
                <span className="font-bold">{alert.missedCount} times</span> in
                a row. Please take your medication or consult your doctor.
              </p>

              {/* Guardian call status */}
              {alert.callingInProgress ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Calling guardian...</span>
                </div>
              ) : alert.guardianCalled ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Guardian{alert.guardianName ? ` (${alert.guardianName})` : ""} has been
                    alerted via phone call
                  </span>
                </div>
              ) : alert.callError ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Guardian call failed: {alert.callError}</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Placing guardian call automatically…</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDismiss(alert.medicineId)}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

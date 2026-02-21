"use client";

import { useState } from "react";
import { AlertTriangle, X, Phone } from "lucide-react";

interface MissedAlarmAlertProps {
  alerts: {
    medicineId: string;
    medicineName: string;
    missedCount: number;
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

              {/* Phone call placeholder */}
              <div className="mt-3 flex items-center gap-2 text-xs text-red-500 bg-red-100 rounded-lg px-3 py-2">
                <Phone className="h-3.5 w-3.5" />
                <span>
                  Emergency call feature will be activated soon
                </span>
              </div>
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

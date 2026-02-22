"use client";

import { useState, useEffect, useCallback } from "react";
import MainTabSwitcher from "@/components/medicine/MainTabSwitcher";
import SubTabBar from "@/components/medicine/SubTabBar";
import MedicineCard from "@/components/medicine/MedicineCard";
import MedicalTestCard from "@/components/medicine/MedicalTestCard";
import AudioAlertToggle from "@/components/medicine/AudioAlertToggle";
import DailyProgressWidget from "@/components/medicine/DailyProgressWidget";
import LowStockAlert from "@/components/medicine/LowStockAlert";
import AddMedicineFAB from "@/components/medicine/AddMedicineFAB";
import VoiceReminderSystem from "@/components/medicine/VoiceReminderSystem";
import MissedAlarmAlert from "@/components/medicine/MissedAlarmAlert";
import EditMedicineModal from "@/components/medicine/EditMedicineModal";
import type { Medicine, MedicalTest, DailyProgress, LowStockItem } from "@/types/medicine";
import toast from "react-hot-toast";

/* â”€â”€ Mock data (medical tests â€” to be DB-backed later) â”€â”€â”€â”€â”€â”€â”€â”€ */
const mockMedicalTests: MedicalTest[] = [
  {
    id: "t1",
    name: "Complete Blood Count (CBC)",
    description: "Routine blood panel â€” fasting required",
    scheduledDate: "Feb 24, 2026",
    scheduledTime: "10:30 AM",
    location: "City Diagnostics Lab",
    icon: "science",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    status: "pending",
    accentColor: "purple",
  },
  {
    id: "t2",
    name: "HbA1c (Diabetes Monitor)",
    description: "3-month blood sugar average",
    scheduledDate: "Feb 18, 2026",
    scheduledTime: "09:00 AM",
    location: "HealthFirst Clinic",
    icon: "monitor_heart",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    status: "overdue",
    accentColor: "red",
  },
  {
    id: "t3",
    name: "Thyroid Panel (TSH, T3, T4)",
    description: "Comprehensive thyroid function",
    scheduledDate: "Mar 5, 2026",
    scheduledTime: "11:00 AM",
    location: "Metro Hospital",
    icon: "biotech",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    status: "scheduled",
    accentColor: "blue",
  },
];

export default function MediReminderPage() {
  const [mainTab, setMainTab] = useState<"medicines" | "tests">("medicines");
  const [subTab, setSubTab] = useState<"daily" | "inventory" | "history">(
    "daily"
  );
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [missedAlerts, setMissedAlerts] = useState<
    { medicineId: string; medicineName: string; missedCount: number; guardianCalled?: boolean; guardianName?: string; callingInProgress?: boolean; callError?: string }[]
  >([]);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [testingGuardianCall, setTestingGuardianCall] = useState(false);
  const [guardianTestResult, setGuardianTestResult] = useState<
    | {
        success: boolean;
        message: string;
        code?: number;
        status?: number;
        callSid?: string;
      }
    | null
  >(null);

  // â”€â”€â”€ Fetch medicines from API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchMedicines = useCallback(async () => {
    try {
      const res = await fetch("/api/medicines");
      const data = await res.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
    // Refresh every 30 seconds to update statuses
    const interval = setInterval(fetchMedicines, 30_000);
    return () => clearInterval(interval);
  }, [fetchMedicines]);

  // â”€â”€â”€ Dose action handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDoseAction = useCallback(
    async (
      medicineId: string,
      action: "taken" | "snoozed" | "missed" | "skipped",
      scheduledTime: string
    ) => {
      try {
        const res = await fetch(`/api/medicines/${medicineId}/dose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, scheduledTime }),
        });
        const data = await res.json();
        if (data.success) {
          // Refresh medicine list to see updated statuses
          await fetchMedicines();
          return data;
        }
      } catch (err) {
        console.error("Dose action failed:", err);
        toast.error("Failed to log dose action");
      }
    },
    [fetchMedicines]
  );

  // Wrappers for MedicineCard
  const handleTake = useCallback(
    (medicineId: string, scheduledTime: string) => {
      handleDoseAction(medicineId, "taken", scheduledTime);
      toast.success("Medicine taken!", { icon: "ðŸ’Š" });
    },
    [handleDoseAction]
  );

  const handleSnooze = useCallback(
    (medicineId: string, scheduledTime: string) => {
      handleDoseAction(medicineId, "snoozed", scheduledTime);
      toast("Snoozed for 5 minutes", { icon: "â°" });
    },
    [handleDoseAction]
  );

  const handleSkip = useCallback(
    (medicineId: string, scheduledTime: string) => {
      handleDoseAction(medicineId, "skipped", scheduledTime);
      toast("Logged as skipped", { icon: "â­ï¸" });
    },
    [handleDoseAction]
  );

  // Voice reminder dose action (async for the VoiceReminderSystem)
  const handleVoiceDoseAction = useCallback(
    async (
      medicineId: string,
      action: "taken" | "snoozed" | "missed",
      scheduledTime: string
    ) => {
      await handleDoseAction(medicineId, action, scheduledTime);
    },
    [handleDoseAction]
  );

  // Missed streak callback
  const handleMissedStreak = useCallback(
    (medicineId: string, count: number) => {
      const med = medicines.find((m) => m._id === medicineId);
      if (!med) return;
      setMissedAlerts((prev) => {
        if (prev.some((a) => a.medicineId === medicineId)) return prev;
        return [
          ...prev,
          { medicineId, medicineName: med.name, missedCount: count },
        ];
      });
    },
    [medicines]
  );

  // Guardian alert â€” call the emergency contact via Twilio voice call
  const handleGuardianAlert = useCallback(
    async (medicineId: string, medicineName: string, missedCount: number) => {
      // Mark as calling in progress
      setMissedAlerts((prev) => {
        const exists = prev.some((a) => a.medicineId === medicineId);
        if (exists) {
          return prev.map((a) =>
            a.medicineId === medicineId
              ? { ...a, callingInProgress: true }
              : a
          );
        }
        return [
          ...prev,
          { medicineId, medicineName, missedCount, callingInProgress: true },
        ];
      });

      try {
        const res = await fetch("/api/medicines/alert-guardian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medicineName, missedCount }),
        });
        const data = await res.json();

        if (data.success) {
          toast.success(
            `Guardian ${data.guardianName} alerted via phone call!`,
            { icon: "\uD83D\uDCDE", duration: 6000 }
          );
          setMissedAlerts((prev) =>
            prev.map((a) =>
              a.medicineId === medicineId
                ? {
                    ...a,
                    callingInProgress: false,
                    guardianCalled: true,
                    guardianName: data.guardianName,
                    callError: undefined,
                  }
                : a
            )
          );
        } else {
          toast.error(data.error ?? "Failed to place guardian call", {
            icon: "⚠️",
          });
          setMissedAlerts((prev) =>
            prev.map((a) =>
              a.medicineId === medicineId
                ? {
                    ...a,
                    callingInProgress: false,
                    guardianCalled: false,
                    callError: data.error ?? "Failed to place guardian call",
                  }
                : a
            )
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to place guardian call";
        toast.error(message, { icon: "⚠️" });
        setMissedAlerts((prev) =>
          prev.map((a) =>
            a.medicineId === medicineId
              ? {
                  ...a,
                  callingInProgress: false,
                  guardianCalled: false,
                  callError: message,
                }
              : a
          )
        );
      }
    },
    []
  );

  // Manual test call (temporary debugging action)
  const handleGuardianTestCall = useCallback(async () => {
    setTestingGuardianCall(true);
    setGuardianTestResult(null);
    try {
      const res = await fetch("/api/medicines/alert-guardian/test", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setGuardianTestResult({
          success: true,
          message: data.message || "Test call initiated",
          callSid: data.callSid,
        });
        toast.success(
          `Guardian test call initiated${data.callSid ? ` (SID: ${data.callSid})` : ""}`,
          { icon: "📞", duration: 7000 }
        );
      } else {
        setGuardianTestResult({
          success: false,
          message: data.error || "Test call failed",
          code: data.twilioCode,
          status: data.httpStatus ?? res.status,
        });
        toast.error(
          `Test call failed${data.twilioCode ? ` (Twilio ${data.twilioCode})` : ""}: ${
            data.error || "Unknown error"
          }`,
          { icon: "⚠️", duration: 8000 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setGuardianTestResult({
        success: false,
        message,
      });
      toast.error(`Test call failed: ${message}`, { icon: "⚠️" });
    } finally {
      setTestingGuardianCall(false);
    }
  }, []);

  // â”€â”€â”€ Compute daily progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const progress: DailyProgress = {
    taken: medicines.filter((m) => m.status === "taken").length,
    missed: medicines.filter((m) => m.status === "missed").length,
    snoozed: medicines.filter((m) => m.status === "snoozed").length,
    pending: medicines.filter(
      (m) => m.status === "upcoming" || m.status === "due-soon"
    ).length,
    total: medicines.length,
  };

  // â”€â”€â”€ Compute low stock items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const lowStock: LowStockItem[] = medicines
    .filter((m) => m.remainingQuantity <= 5 && m.remainingQuantity > 0)
    .map((m) => ({
      name: m.name,
      daysLeft: m.remainingQuantity,
      percentLeft: Math.round(
        (m.remainingQuantity / Math.max(m.totalQuantity, 1)) * 100
      ),
    }));

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Medi Reminder
            </h1>
            <p className="text-sm text-slate-500">
              Manage your daily medications and tests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGuardianTestCall}
              disabled={testingGuardianCall}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            >
              {testingGuardianCall ? (
                <span className="animate-spin h-4 w-4 border-2 border-amber-700 border-t-transparent rounded-full" />
              ) : (
                <span>📞</span>
              )}
              {testingGuardianCall ? "Testing Call..." : "Test Guardian Call"}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100 text-sm text-slate-500">
              <span className="material-symbols-outlined text-lg">
                calendar_month
              </span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left â€” Main content */}
          <div className="flex-1 flex flex-col gap-6">
            {guardianTestResult && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  guardianTestResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <p className="font-semibold">
                  {guardianTestResult.success
                    ? "Guardian test call initiated"
                    : "Guardian test call failed"}
                </p>
                <p className="mt-1">{guardianTestResult.message}</p>
                {(guardianTestResult.code || guardianTestResult.status || guardianTestResult.callSid) && (
                  <p className="mt-1 text-xs opacity-90">
                    {guardianTestResult.code ? `Twilio code: ${guardianTestResult.code} • ` : ""}
                    {guardianTestResult.status ? `HTTP: ${guardianTestResult.status} • ` : ""}
                    {guardianTestResult.callSid ? `Call SID: ${guardianTestResult.callSid}` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Main tab switcher: Medicines / Medical Tests */}
            <MainTabSwitcher activeTab={mainTab} onTabChange={setMainTab} />

            {/* Sub-tab bar */}
            <SubTabBar activeTab={subTab} onTabChange={setSubTab} />

            {/* Medicine cards */}
            {mainTab === "medicines" && (
              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <span className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-slate-400">
                      Loading medicines...
                    </p>
                  </div>
                ) : medicines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary/40">
                        medication
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-700">
                        No medicines yet
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">
                        Tap the + button to scan a prescription or add medicines
                        manually
                      </p>
                    </div>
                  </div>
                ) : (
                  medicines.map((med) => (
                    <MedicineCard
                      key={med._id}
                      medicine={med}
                      onTake={handleTake}
                      onSnooze={handleSnooze}
                      onSkip={handleSkip}
                      onEdit={setEditingMedicine}
                    />
                  ))
                )}
              </div>
            )}

            {/* Medical tests (still mock for now) */}
            {mainTab === "tests" && (
              <div className="grid grid-cols-1 gap-6">
                {mockMedicalTests.map((test) => (
                  <MedicalTestCard key={test.id} test={test} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-6">
            <AudioAlertToggle
              enabled={audioEnabled}
              onToggle={setAudioEnabled}
            />
            <DailyProgressWidget progress={progress} />
            {lowStock.length > 0 && <LowStockAlert items={lowStock} />}
          </aside>
        </div>
      </div>

      {/* Voice Reminder System (invisible â€” runs in background) */}
      <VoiceReminderSystem
        medicines={medicines}
        audioEnabled={audioEnabled}
        onDoseAction={handleVoiceDoseAction}
        onMissedStreak={handleMissedStreak}
        onGuardianAlert={handleGuardianAlert}
      />

      {/* Missed Alarm Alerts */}
      <MissedAlarmAlert
        alerts={missedAlerts}
        onDismiss={(id) =>
          setMissedAlerts((prev) =>
            prev.filter((a) => a.medicineId !== id)
          )
        }
      />

      {/* FAB â€” scan prescription via OCR / manual add */}
      <AddMedicineFAB onRefresh={fetchMedicines} />

      {/* Edit medicine modal */}
      {editingMedicine && (
        <EditMedicineModal
          medicine={editingMedicine}
          onClose={() => setEditingMedicine(null)}
          onSaved={fetchMedicines}
        />
      )}
    </main>
  );
}

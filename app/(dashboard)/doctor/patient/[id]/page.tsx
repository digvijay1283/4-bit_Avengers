"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import PatientProfileHeader from "@/components/doctor/PatientProfileHeader";
import PatientVitalsPanel from "@/components/doctor/PatientVitalsPanel";
import PatientReportSummary from "@/components/doctor/PatientReportSummary";
import PatientMedicineHistory from "@/components/doctor/PatientMedicineHistory";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────── */
type PatientData = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
};

type VitalItem = {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  status: "normal" | "warning" | "critical";
};

type ReportItem = {
  id: string;
  title: string;
  date: string;
  summary: string;
  fileUrl?: string;
  type: string;
  status: string;
  severity: "normal" | "attention" | "critical";
};

type MedicineItem = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isActive: boolean;
  adherence: number;
  startDate: string;
  status: string;
  missedStreakCount: number;
  remainingQuantity: number;
  totalQuantity: number;
};

/* ─── Component ─────────────────────────────────────────── */
export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [vitals, setVitals] = useState<VitalItem[]>([]);
  const [vitalsUpdated, setVitalsUpdated] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);

  const fetchPatientData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError("");

    try {
      const encoded = encodeURIComponent(patientId);

      // Fetch all data in parallel
      const [profileRes, vitalsRes, reportsRes, medsRes] = await Promise.all([
        fetch(`/api/doctor/patient/${encoded}`),
        fetch(`/api/doctor/patient/${encoded}/vitals`),
        fetch(`/api/doctor/patient/${encoded}/reports`),
        fetch(`/api/doctor/patient/${encoded}/medicines`),
      ]);

      // Profile (required)
      const profileData = await profileRes.json();
      if (!profileRes.ok)
        throw new Error(profileData.error ?? "Patient not found");
      setPatient(profileData.patient);

      // Vitals (optional — may be empty)
      const vitalsData = await vitalsRes.json().catch(() => null);
      if (vitalsData?.success) {
        setVitals(vitalsData.vitals ?? []);
        setVitalsUpdated(vitalsData.lastUpdated ?? null);
      }

      // Reports (optional)
      const reportsData = await reportsRes.json().catch(() => null);
      if (reportsData?.success) {
        setReports(reportsData.reports ?? []);
      }

      // Medicines (optional)
      const medsData = await medsRes.json().catch(() => null);
      if (medsData?.success) {
        setMedicines(medsData.medicines ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load patient data"
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-[#64748B]">Loading patient profile…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">
            Patient Not Found
          </h2>
          <p className="text-sm text-[#64748B] mb-6">
            {error || "We couldn't locate a patient with that ID."}
          </p>
          <Link
            href="/doctor"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0F4D2A] transition"
          >
            Back to Console
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Patient Header */}
      <PatientProfileHeader patient={patient} />

      {/* Refresh bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={fetchPatientData}
          className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-primary transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh data
        </button>
      </div>

      {/* Vitals */}
      <PatientVitalsPanel vitals={vitals} lastUpdated={vitalsUpdated} />

      {/* Reports & Medicines — side by side on larger screens */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="w-full xl:w-3/5">
          <PatientReportSummary reports={reports} />
        </div>
        <div className="w-full xl:w-2/5">
          <PatientMedicineHistory medicines={medicines} />
        </div>
      </div>
    </div>
  );
}

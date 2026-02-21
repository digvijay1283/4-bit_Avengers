"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import PatientProfileHeader from "@/components/doctor/PatientProfileHeader";
import PatientVitalsPanel from "@/components/doctor/PatientVitalsPanel";
import PatientReportSummary from "@/components/doctor/PatientReportSummary";
import PatientMedicineHistory from "@/components/doctor/PatientMedicineHistory";
import Link from "next/link";

type PatientData = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

type ApiResponse = {
  patient: PatientData;
  records: Record<string, unknown[]>;
  totalRecords: number;
  error?: string;
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    async function fetchPatient() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/doctor/patient/${encodeURIComponent(patientId)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to fetch patient data");
          return;
        }
        setData(json);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [patientId]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-[#64748B]">
            Loading patient profile…
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Patient Header */}
      <PatientProfileHeader patient={data.patient} />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left – Vitals + Medicine */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">
          <PatientVitalsPanel />
          <PatientMedicineHistory />
        </div>

        {/* Right – Reports & Summaries */}
        <div className="w-full lg:w-3/5">
          <PatientReportSummary />
        </div>
      </div>
    </div>
  );
}

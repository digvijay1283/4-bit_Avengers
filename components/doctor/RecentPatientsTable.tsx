"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";

type PatientRow = {
  patientUserId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string;
  lastSharedAt: string;
  shareCount: number;
  totalReportsShared: number;
  lastShareCode: string;
};

export default function RecentPatientsTable() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/doctor/recent-patients");
        const data = await res.json();
        if (data.success) setPatients(data.patients);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, []);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const dayMs = 86400000;

    if (diff < dayMs && d.getDate() === now.getDate()) {
      return `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diff < 2 * dayMs) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRisk = (p: PatientRow): "low" | "medium" | "high" => {
    if (p.totalReportsShared >= 5) return "high";
    if (p.shareCount >= 3) return "medium";
    return "low";
  };

  const riskBadge: Record<string, string> = {
    low: "bg-green-50 text-green-600",
    medium: "bg-amber-50 text-amber-600",
    high: "bg-red-50 text-red-500",
  };

  const RiskIcon = ({ risk }: { risk: string }) => {
    if (risk === "high") return <AlertTriangle className="h-3.5 w-3.5" />;
    if (risk === "medium") return <Clock className="h-3.5 w-3.5" />;
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <h3 className="font-semibold text-[#0F172A]">Recent Patients</h3>
        <span className="text-xs text-[#94A3B8]">
          {loading ? "Loading…" : `${patients.length} patients`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#64748B]">
            No patients yet
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Patients will appear here after they share reports via QR code
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9]">
          {patients.map((p) => {
            const risk = getRisk(p);
            const initials = p.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={p.patientUserId}
                onClick={() =>
                  router.push(`/doctor/patient/${p.patientUserId}`)
                }
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.fullName}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-sm font-bold text-[#64748B]">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {p.fullName}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {fmtDate(p.lastSharedAt)} • {p.totalReportsShared} reports
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${riskBadge[risk]}`}
                  >
                    <RiskIcon risk={risk} />
                    {risk}
                  </span>
                  <span className="hidden sm:inline text-xs text-[#64748B]">
                    {p.shareCount} visit{p.shareCount > 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#CBD5E1]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

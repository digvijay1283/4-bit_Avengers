"use client";

import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

type PatientData = {
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  createdAt: string;
  userId: string;
};

export default function PatientProfileHeader({
  patient,
}: {
  patient: PatientData;
}) {
  const initials = patient.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const joined = new Date(patient.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Green accent bar */}
      <div className="h-2 bg-gradient-to-r from-primary to-[#34D399]" />

      <div className="p-5 sm:p-6">
        {/* Back link */}
        <Link
          href="/doctor"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Console
        </Link>

        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.fullName}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-[#E2E8F0]"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl border-2 border-primary/20">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                {patient.fullName}
              </h1>
              <span
                className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                  patient.status === "active"
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {patient.status}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {patient.email}
              </span>
              {patient.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {patient.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {joined}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                ID: {patient.userId.slice(0, 8)}…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

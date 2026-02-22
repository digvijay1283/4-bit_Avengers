"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function DoctorHero() {
  const [doctorName, setDoctorName] = useState("Doctor");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success && data.user?.fullName) {
          setDoctorName(data.user.fullName.split(" ")[0]);
        }
      } catch {
        /* use fallback */
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden min-h-[220px] flex items-center shadow-lg">
      {/* Background */}
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGQd4jDSuSro3i2WFfIqEQtTOIMCSbE9pbUgH8JGZZFD8QVWotVOvia7sp5UctZWC3FZrDREpKnyYeFt4hHQzpBudKCh1BeEP__YHdjq4lYZ0vLEiR6S4NM53JJhqYV5FxOGKksOgxv_iCpA2r8TfEOK2BIJfvLkJasmgGT2aHU2QgVDyOFeBUDmKmftvCpccCbbsFv24efMGfz6j-iiiPWuDqoNE-Bq7--jVh1EO9wG4AhQohMAScLY6RgcQpRFYRmwl6VcW4n1-n"
        alt="Doctor with digital tablet"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-[#0F172A]/40" />

      <div className="relative z-10 p-6 md:p-10 w-full">
        <div className="max-w-lg text-white">
          <p className="text-sm font-medium text-soft-mint mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              stethoscope
            </span>
            Doctor Console
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3">
            Welcome back, Dr. {doctorName}
          </h1>
          <p className="text-white/80 text-sm md:text-base font-medium">
            Scan a patient QR code to access their complete health profile,
            medical reports, and AI-generated summaries.
          </p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Console",
};

export default function DoctorPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F172A]">Doctor Console</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          This area is restricted to doctor accounts. You can place doctor-only workflows here.
        </p>
      </div>
    </main>
  );
}

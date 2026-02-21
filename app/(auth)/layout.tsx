import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-[#106534] via-[#0F4D2A] to-[#122018] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              VITALAI
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight">
              Preventive care,
              <br />
              before problems begin.
            </h1>
            <p className="mt-4 max-w-md text-sm text-emerald-100/90">
              Track vitals, manage medicines, and receive AI-powered insights in
              one unified health companion.
            </p>
          </div>

          <div className="space-y-3 text-sm text-emerald-100/90">
            <p>• Real-time wearable sync</p>
            <p>• Smart risk scoring</p>
            <p>• Automated medicine reminders</p>
            <p>• Weekly actionable reports</p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#106534]">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to home
            </Link>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

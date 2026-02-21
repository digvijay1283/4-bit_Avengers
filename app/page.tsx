import Link from "next/link";
import {
  Leaf,
  Heart,
  Brain,
  Pill,
  FileText,
  Shield,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { APP_NAME } from "@/constants";

const features = [
  {
    icon: Heart,
    title: "Vital Monitoring",
    desc: "Track heart rate, blood pressure, sleep & activity in real-time.",
    color: "bg-red-50 text-red-500",
  },
  {
    icon: Brain,
    title: "Mental Wellness",
    desc: "Daily mood tracking, stress scores, and AI-powered insights.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Pill,
    title: "Medi Reminders",
    desc: "Never miss a dose with smart medication scheduling.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: FileText,
    title: "Report Analysis",
    desc: "Upload lab reports and get AI-summarised health insights.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Stethoscope,
    title: "Doctor Portal",
    desc: "Doctors can QR-scan patients for instant health profiles.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Data Privacy",
    desc: "End-to-end encrypted. Your health data stays yours.",
    color: "bg-slate-50 text-slate-600",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight text-slate-800">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-[#0F4D2A] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#D1FAE5]/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-soft-mint/50 border border-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Preventive Healthcare
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
              Your health,{" "}
              <span className="text-primary">intelligently</span> managed.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#64748B] leading-relaxed max-w-2xl">
              {APP_NAME} combines real-time vitals monitoring, AI health
              insights, and smart medication reminders to keep you ahead of
              health risks.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-white hover:bg-[#0F4D2A] transition shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?role=doctor"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white px-7 py-3.5 text-base font-bold text-[#0F172A] hover:border-primary hover:text-primary transition"
              >
                <Stethoscope className="h-4 w-4" />
                I&apos;m a Doctor
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6 text-sm text-[#94A3B8]">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-primary/60 to-[#34D399] flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {["AJ", "MK", "SR", "PD"][i]}
                  </div>
                ))}
              </div>
              <span>
                <strong className="text-[#0F172A]">2,400+</strong> users
                tracking their health
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
              Everything for preventive care
            </h2>
            <p className="mt-3 text-base text-[#64748B] max-w-xl mx-auto">
              A comprehensive platform that keeps patients informed and doctors
              connected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#0F172A] to-[#1E3A2F] p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10">
              <Activity className="h-10 w-10 text-[#34D399] mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Start your health journey today
              </h2>
              <p className="text-white/70 max-w-lg mx-auto mb-8">
                Join thousands who are taking proactive steps towards better
                health with AI-powered monitoring.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-[#34D399] hover:text-[#0F172A] transition shadow-lg"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#E2E8F0] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-slate-700">
              {APP_NAME}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} {APP_NAME}. Built for the Cavista
            Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}

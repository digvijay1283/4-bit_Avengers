"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden min-h-75 flex items-center shadow-lg group">
      {/* Background Image */}
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGQd4jDSuSro3i2WFfIqEQtTOIMCSbE9pbUgH8JGZZFD8QVWotVOvia7sp5UctZWC3FZrDREpKnyYeFt4hHQzpBudKCh1BeEP__YHdjq4lYZ0vLEiR6S4NM53JJhqYV5FxOGKksOgxv_iCpA2r8TfEOK2BIJfvLkJasmgGT2aHU2QgVDyOFeBUDmKmftvCpccCbbsFv24efMGfz6j-iiiPWuDqoNE-Bq7--jVh1EO9wG4AhQohMAScLY6RgcQpRFYRmwl6VcW4n1-n"
        alt="Doctor holding a digital tablet in a modern medical office"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/90 to-primary/40" />

      <div className="relative z-10 p-6 md:p-10 w-full flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="max-w-lg text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Health Is Wealth, Trust in Our Care
          </h1>
          <p className="text-white/90 text-sm md:text-base font-medium mb-6">
            Your AI-driven preventive health companion is ready to analyze your
            vitals.
          </p>
        </div>

        {/* Floating Glass Card */}
        <div className="glass-card p-4 rounded-xl w-full max-w-50 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-white">
              analytics
            </span>
            <span className="text-white font-bold text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <h3 className="text-white text-sm font-medium">AI Analysis</h3>
          <div className="mt-2 text-white text-2xl font-bold">75%</div>
          <div className="w-full bg-white/30 rounded-full h-1.5 mt-2">
            <div className="bg-white h-1.5 rounded-full w-[75%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

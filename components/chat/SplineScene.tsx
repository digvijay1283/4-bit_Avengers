"use client";

import dynamic from "next/dynamic";

// Dynamically import Spline with SSR disabled to avoid hydration errors
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Pulsing glow rings */}
        <span className="absolute h-48 w-48 animate-ping rounded-full bg-soft-mint/20" />
        <span className="absolute h-36 w-36 animate-pulse rounded-full bg-soft-mint/30" />
        {/* Inner sphere placeholder */}
        <div className="relative h-28 w-28 rounded-full bg-linear-to-br from-soft-mint/40 to-primary/60 border border-soft-mint/40 shadow-2xl flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-soft-mint animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

interface SplineSceneProps {
  className?: string;
}

export default function SplineScene({ className }: SplineSceneProps) {
  return (
    <div className={className}>
      <Spline scene="https://prod.spline.design/rcZsq6d5O-Goxiy9/scene.splinecode" />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

// Dynamically import Spline with SSR disabled to avoid hydration errors
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-white">
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
  /** Extra className on the outer wrapper */
  className?: string;
}

/**
 * Full-bleed Spline scene rendered as a background layer.
 *
 * The scene is scaled up ~108% and offset slightly so the Spline watermark
 * (bottom-right corner of the canvas) is pushed outside the visible clip area.
 * An additional white rect is placed over the bottom-right edge as a belt-and-
 * suspenders measure.
 */
export default function SplineScene({ className }: SplineSceneProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white ${className ?? ""}`}
    >
      {/* Scale wrapper — pushes watermark outside the overflow-hidden clip */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "scale(1.08)",
          transformOrigin: "center center",
        }}
      >
        <Spline
          scene="https://prod.spline.design/rcZsq6d5O-Goxiy9/scene.splinecode"
          style={{ width: "100%", height: "100%", background: "white" }}
        />
      </div>

      {/* Hard white mask over bottom-right corner where the watermark lives */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 200,
          height: 56,
          background: "white",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";

interface Live2DViewerProps {
  /** Pass true while AI audio is playing to animate mouth */
  speaking: boolean;
  className?: string;
}

/**
 * Renders the Hiyori Live2D Cubism 4 model via pixi.js + pixi-live2d-display.
 * Requires the Live2DCubismCore script to be loaded globally (see root layout).
 */
export default function Live2DViewer({ speaking, className }: Live2DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<unknown>(null);
  const modelRef = useRef<unknown>(null);
  const mouthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initLive2D() {
      // Wait up to 6 s for the Cubism Core WASM to be injected by the CDN script
      let waited = 0;
      while (!(window as { Live2DCubismCore?: unknown }).Live2DCubismCore && waited < 6000) {
        await new Promise<void>((r) => setTimeout(r, 250));
        waited += 250;
      }

      if (!(window as { Live2DCubismCore?: unknown }).Live2DCubismCore) {
        console.warn("Live2DCubismCore not available — character will not render.");
        setError(true);
        return;
      }

      // Dynamic imports — avoids SSR issues entirely
      // (kept inside try so any import-time throws are caught gracefully)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PIXI = (await import("pixi.js")) as any;
        // Import the Cubism 4-only subpath export to avoid the Cubism 2
        // "live2d.min.js" runtime check that lives in the default index bundle.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Live2DModel } = (await import("pixi-live2d-display/cubism4")) as any;

        if (cancelled || !canvasRef.current) return;

        // Wait one animation frame so the browser has computed the canvas layout
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled || !canvasRef.current) return;

        // Register PIXI ticker so Live2D updates correctly
        Live2DModel.registerTicker(PIXI.Ticker);

        const canvas = canvasRef.current;
        const w = canvas.offsetWidth || 400;
        const h = canvas.offsetHeight || 600;

        const app = new PIXI.Application({
          view: canvas,
          width: w,
          height: h,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true,
        });
        appRef.current = app;

        const model = await Live2DModel.from("/api/model/Hiyori.model3.json", {
          // pixi.js v7 removed InteractionManager; disable auto-interaction
          // to prevent "manager.on is not a function" crash at first render.
          autoInteract: false,
        });
        if (cancelled) {
          model.destroy();
          return;
        }
        modelRef.current = model;
        app.stage.addChild(model);

        // Use actual model natural dimensions for correct scaling
        model.scale.set(1);
        const naturalW: number = model.width  || 1;
        const naturalH: number = model.height || 1;

        // ZOOM_FACE: scale up and shift centre downward so the face fills the panel.
        // 1.8 = zoom multiplier; 0.30 = fractional offset down (face is ~top-20% of body).
        const ZOOM = 1.8;
        const FACE_OFFSET = 0.30; // fraction of scaled height to shift down

        const baseScale = Math.min((w * 0.85) / naturalW, (h * 0.85) / naturalH);
        const scale = baseScale * ZOOM;
        model.scale.set(scale);
        model.anchor.set(0.5, 0.5);
        model.x = w * 0.5;
        model.y = h * 0.5 + naturalH * scale * FACE_OFFSET;

        // Helper: refit whenever the canvas container resizes
        function refit() {
          if (!canvasRef.current) return;
          const nw = canvasRef.current.offsetWidth  || w;
          const nh = canvasRef.current.offsetHeight || h;
          app.renderer.resize(nw, nh);
          const nBase = Math.min((nw * 0.85) / naturalW, (nh * 0.85) / naturalH);
          const ns = nBase * ZOOM;
          model.scale.set(ns);
          model.x = nw * 0.5;
          model.y = nh * 0.5 + naturalH * ns * FACE_OFFSET;
        }

        const ro = new ResizeObserver(refit);
        if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
        // Store so cleanup can disconnect
        (appRef.current as { _ro?: ResizeObserver })._ro = ro;

        // Random idle motion loop
        model.motion("Idle");

        setLoaded(true);
      } catch (err) {
        console.error("Live2D load error:", err);
        if (!cancelled) setError(true);
      }
    }

    initLive2D().catch((err) => {
      console.error("Live2D initLive2D uncaught:", err);
      setError(true);
    });

    return () => {
      cancelled = true;
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
      if (appRef.current) {
        // Disconnect resize observer before destroying
        const ro = (appRef.current as { _ro?: ResizeObserver })._ro;
        if (ro) ro.disconnect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (appRef.current as any).destroy(false, { children: true });
        appRef.current = null;
      }
      modelRef.current = null;
    };
  }, []);

  // Animate mouth while speaking
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = modelRef.current as any;
    if (!model?.internalModel?.coreModel) return;

    if (mouthTimerRef.current) {
      clearInterval(mouthTimerRef.current);
      mouthTimerRef.current = null;
    }

    if (speaking) {
      let t = 0;
      mouthTimerRef.current = setInterval(() => {
        t += 0.22;
        const v = Math.abs(Math.sin(t)) * 0.85;
        try {
          model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", v);
        } catch { /* param may differ per model */ }
      }, 50);
    } else {
      try {
        model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", 0);
      } catch { /* ignore */ }
    }

    return () => {
      if (mouthTimerRef.current) {
        clearInterval(mouthTimerRef.current);
        mouthTimerRef.current = null;
      }
    };
  }, [speaking]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ""}`}>
      {/* Loading spinner */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-transparent">
          <div className="h-14 w-14 rounded-full border-4 border-[#D1FAE5] border-t-[#106534] animate-spin" />
          <span className="text-xs text-[#64748B]">Loading character…</span>
        </div>
      )}

      {/* Error fallback: show a decorative orb instead */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-40 w-40 rounded-full shadow-2xl"
            style={{
              background:
                "radial-gradient(circle at 38% 35%, #d1fae5 0%, #4ade80 28%, #16a34a 58%, #106534 82%, #072b16 100%)",
              boxShadow: "0 8px 48px rgba(16,101,52,0.35)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

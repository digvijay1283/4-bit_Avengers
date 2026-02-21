import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ─── Images ─────────────────────────────────────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "prod.spline.design",
        pathname: "/**",
      },
    ],
  },

  /* ─── Transpile Spline packages for Next.js compatibility ────────── */
  transpilePackages: ["@splinetool/react-spline", "@splinetool/runtime"],

  /* ─── Tesseract.js — keep worker out of Webpack bundle ───────────── */
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;

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
    ],
  },

  /* ─── Tesseract.js — keep worker out of Webpack bundle ───────────── */
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;

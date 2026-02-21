import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ─── Images ─────────────────────────────────────────────────────── */
  images: {
    // Add external domains here if you use next/image with remote URLs
    // domains: ["example.com"],
  },

  /* ─── Redirects / Rewrites (uncomment as needed) ─────────────────── */
  // async redirects() { return []; },
  // async rewrites()  { return []; },

  /* ─── Environment (expose only public vars here) ─────────────────── */
  // env: {},
};

export default nextConfig;

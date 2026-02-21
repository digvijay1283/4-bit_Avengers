import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "VitalAI — Preventive Health Companion",
    template: "%s | VitalAI",
  },
  description:
    "AI-driven preventive health companion — real-time vitals, smart reminders, and intelligent health insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          precedence="default"
        />
      </head>
      <body
        className={`${manrope.variable} font-[family-name:var(--font-manrope)] antialiased bg-[#F8FAFC] text-[#1E293B]`}
      >
        {children}
      </body>
    </html>
  );
}

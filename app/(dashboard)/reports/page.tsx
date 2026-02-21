import type { Metadata } from "next";
import ReportsPageContent from "@/components/reports/ReportsPageContent";

export const metadata: Metadata = {
  title: "Reports | VitalAI",
};

export default function ReportsPage() {
  return <ReportsPageContent />;
}

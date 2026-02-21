import type { Metadata } from "next";
import MentalHealthContent from "@/components/mental-health/MentalHealthContent";

export const metadata: Metadata = {
  title: "Mental Health | VitalAI",
};

export default function MentalHealthPage() {
  return <MentalHealthContent />;
}

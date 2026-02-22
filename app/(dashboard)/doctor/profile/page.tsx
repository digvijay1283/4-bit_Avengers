import type { Metadata } from "next";
import DoctorProfileView from "@/components/profile/DoctorProfileView";

export const metadata: Metadata = {
  title: "Doctor Profile | VitalAI",
};

export default function DoctorProfilePage() {
  return <DoctorProfileView />;
}

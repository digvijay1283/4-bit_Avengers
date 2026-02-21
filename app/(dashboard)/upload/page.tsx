import type { Metadata } from "next";
import UploadContent from "@/components/upload/UploadContent";

export const metadata: Metadata = {
  title: "Upload Report | VitalAI",
};

export default function UploadPage() {
  return <UploadContent />;
}

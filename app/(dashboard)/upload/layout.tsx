import { requireRole } from "@/lib/rbac";

export default async function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("user", "/doctor");
  return children;
}

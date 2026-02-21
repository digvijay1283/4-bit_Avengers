import { requireRole } from "@/lib/rbac";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Non-doctor users are redirected to user dashboard
  await requireRole("doctor", "/dashboard");
  return children;
}

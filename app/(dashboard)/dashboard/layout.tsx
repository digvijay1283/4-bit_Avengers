import { requireRole } from "@/lib/rbac";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("user", "/doctor");
  return children;
}

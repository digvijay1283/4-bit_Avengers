import { requireRole } from "@/lib/rbac";

export default async function MentalHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("user", "/doctor");
  return children;
}

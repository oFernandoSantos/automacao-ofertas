import { AppShell } from "@/components/layout/app-shell";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();
  return <AppShell>{children}</AppShell>;
}

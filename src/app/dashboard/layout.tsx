import { DashboardShell } from "@/components/dashboard-shell";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// SEC-02 FIX: Authenticate every dashboard request server-side.
// Previously this layout had NO auth check, meaning any anonymous visitor
// who typed /dashboard in a browser saw all admin data.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.app_metadata ?? {};
  const isAdmin =
    meta.is_admin === true ||
    meta.role === "admin" ||
    meta.role === "supervisor";

  if (!isAdmin || meta.is_blocked === true) {
    redirect("/login?error=unauthorized");
  }

  return (
    <DashboardShell>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </DashboardShell>
  );
}

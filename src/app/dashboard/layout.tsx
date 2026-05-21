import { DashboardShell } from "@/components/dashboard-shell";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <ConfirmDialogProvider>
        {children}
      </ConfirmDialogProvider>
    </DashboardShell>
  );
}

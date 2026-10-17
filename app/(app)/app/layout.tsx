import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/app-shell";
import { getAutomationContext } from "@/services/automation";
import { getPendingApprovals } from "@/services/overview";
import { getCurrentUser, getNotifications, getWorkspace } from "@/services/user";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · Syxoria" },
  // Authenticated product area — never index.
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // TODO(auth): verify the session here (or in proxy.ts) and redirect to /login.
  const [user, workspace, notifications, approvals, automation] = await Promise.all([
    getCurrentUser(),
    getWorkspace(),
    getNotifications(),
    getPendingApprovals(),
    getAutomationContext(),
  ]);

  return (
    <AppShell user={user} workspace={workspace} notifications={notifications} badges={{ approvals }} automation={automation}>
      {children}
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/app-shell";
import { getInsights } from "@/services/insights";
import { getProjects } from "@/services/projects";
import { getCurrentUser, getNotifications, getWorkspace } from "@/services/user";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · Syxoria" },
  // Authenticated product area — never index.
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // TODO(auth): verify the session here (or in proxy.ts) and redirect to /login.
  const [user, workspace, notifications, insights, projects] = await Promise.all([
    getCurrentUser(),
    getWorkspace(),
    getNotifications(),
    getInsights(),
    getProjects(),
  ]);

  return (
    <AppShell
      user={user}
      workspace={workspace}
      notifications={notifications}
      badges={{ insights: insights.filter((i) => i.status === "new").length }}
      projects={projects
        .filter((p) => p.status !== "completed")
        .map(({ id, name, status }) => ({ id, name, status }))}
    >
      {children}
    </AppShell>
  );
}

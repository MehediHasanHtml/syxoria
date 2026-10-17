import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsView } from "@/components/dashboard/settings/settings-view";
import { isSettingsTab } from "@/components/dashboard/settings/settings-tabs";
import { getAutonomyPolicy } from "@/services/onboarding";
import { getCurrentUser, getNotificationPreferences, getWorkspace } from "@/services/user";

export const metadata: Metadata = { title: "Settings & Autonomy" };

export default async function SettingsPage({ searchParams }: PageProps<"/app/settings">) {
  const { tab } = await searchParams;
  const [user, workspace, preferences, policy] = await Promise.all([getCurrentUser(), getWorkspace(), getNotificationPreferences(), getAutonomyPolicy()]);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Settings & Autonomy" }]}
        title="Settings & Autonomy"
        description="What Syxoria may do on its own, the controls that stop it, and your account, workspace, notifications and security."
      />
      <SettingsView initialTab={isSettingsTab(tab) ? tab : "autonomy"} user={user} workspace={workspace} preferences={preferences} policy={policy} />
    </>
  );
}

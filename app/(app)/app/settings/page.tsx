import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsView } from "@/components/dashboard/settings/settings-view";
import { isSettingsTab } from "@/components/dashboard/settings/settings-tabs";
import { getCurrentUser, getNotificationPreferences, getWorkspace } from "@/services/user";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: PageProps<"/app/settings">) {
  const { tab } = await searchParams;
  const [user, workspace, preferences] = await Promise.all([getCurrentUser(), getWorkspace(), getNotificationPreferences()]);
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Settings" }]}
        title="Settings"
        description="Manage your account, workspace, notifications and security."
      />
      <SettingsView initialTab={isSettingsTab(tab) ? tab : "account"} user={user} workspace={workspace} preferences={preferences} />
    </>
  );
}

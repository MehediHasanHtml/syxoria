import type { Metadata } from "next";
import { WsHead } from "@/components/dashboard/ws/kit";
import { SettingsView } from "@/components/dashboard/settings/settings-view";
import { isSettingsTab } from "@/components/dashboard/settings/settings-tabs";
import { getAutonomyPolicy } from "@/services/onboarding";
import { getCurrentUser, getNotificationPreferences, getWorkspace } from "@/services/user";
import { getSafetySettings, getTeam, getTools } from "@/services/workspace";

export const metadata: Metadata = { title: "Settings & Autonomy" };

export default async function SettingsPage({ searchParams }: PageProps<"/app/settings">) {
  const { tab } = await searchParams;
  const [user, workspace, preferences, policy, safety, team, tools] = await Promise.all([
    getCurrentUser(),
    getWorkspace(),
    getNotificationPreferences(),
    getAutonomyPolicy(),
    getSafetySettings(),
    getTeam(),
    getTools(),
  ]);
  return (
    <div className="ws">
      <WsHead eyebrow="System" title="Settings & Autonomy" lead="What Syxoria may do on its own, the controls that stop it, and your company, team, notifications and security." />
      <div>
        <SettingsView initialTab={isSettingsTab(tab) ? tab : "autonomy"} user={user} workspace={workspace} preferences={preferences} policy={policy} safety={safety} team={team} tools={tools} />
      </div>
    </div>
  );
}

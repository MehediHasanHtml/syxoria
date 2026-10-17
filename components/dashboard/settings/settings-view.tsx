"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import type { AutonomyPolicy, NotificationPreferences, User, Workspace } from "@/types";
import type { TeamMember, WorkspaceTool } from "@/types/workspace";
import { AutonomySettings, type SafetySettings } from "./autonomy-settings";
import { NotificationSettings } from "./notification-settings";
import { PermissionsSettings } from "./permissions-settings";
import { PrivacySettings } from "./privacy-settings";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";
import { TeamSettings } from "./team-settings";
import { WorkspaceSettings } from "./workspace-settings";
import { settingsTabs as tabs, type SettingsTab } from "./settings-tabs";

export function SettingsView({
  initialTab,
  user,
  workspace,
  preferences,
  policy,
  safety,
  team,
  tools,
}: {
  initialTab: SettingsTab;
  user: User;
  workspace: Workspace;
  preferences: NotificationPreferences;
  policy: AutonomyPolicy;
  safety: SafetySettings;
  team: TeamMember[];
  tools: WorkspaceTool[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  return (
    <>
      <Tabs
        variant="underline"
        label="Settings sections"
        items={tabs}
        value={tab}
        idPrefix="settings"
        onValueChange={(t) => {
          setTab(t);
          router.replace(`/app/settings?tab=${t}`, { scroll: false });
        }}
        className="w-full"
      />
      <div id={`settings-panel-${tab}`} role="tabpanel" aria-labelledby={`settings-tab-${tab}`} className="mt-8 animate-fade-in" key={tab}>
        {tab === "autonomy" && <AutonomySettings policy={policy} safety={safety} />}
        {tab === "workspace" && <WorkspaceSettings workspace={workspace} />}
        {tab === "account" && <ProfileSettings user={user} />}
        {tab === "team" && <TeamSettings team={team} />}
        {tab === "notifications" && <NotificationSettings initial={preferences} />}
        {tab === "permissions" && <PermissionsSettings tools={tools} />}
        {tab === "security" && (
          <>
            <PrivacySettings />
            <SecuritySettings workspace={workspace} />
          </>
        )}
      </div>
    </>
  );
}

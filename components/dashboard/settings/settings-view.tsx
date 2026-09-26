"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import type { NotificationPreferences, User, Workspace } from "@/types";
import { NotificationSettings } from "./notification-settings";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";
import { WorkspaceSettings } from "./workspace-settings";
import { settingsTabs as tabs, type SettingsTab } from "./settings-tabs";

export function SettingsView({
  initialTab,
  user,
  workspace,
  preferences,
}: {
  initialTab: SettingsTab;
  user: User;
  workspace: Workspace;
  preferences: NotificationPreferences;
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
      <div id={`settings-panel-${tab}`} role="tabpanel" aria-labelledby={`settings-tab-${tab}`} className="mt-8 max-w-3xl animate-fade-in" key={tab}>
        {tab === "account" && <ProfileSettings user={user} />}
        {tab === "workspace" && <WorkspaceSettings workspace={workspace} />}
        {tab === "notifications" && <NotificationSettings initial={preferences} />}
        {tab === "security" && <SecuritySettings workspace={workspace} />}
      </div>
    </>
  );
}


/** Shared (server + client) settings tab definitions. */
export type SettingsTab = "account" | "workspace" | "notifications" | "security";

export const settingsTabs: { value: SettingsTab; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "workspace", label: "Workspace" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security" },
];

export function isSettingsTab(v: unknown): v is SettingsTab {
  return settingsTabs.some((t) => t.value === v);
}

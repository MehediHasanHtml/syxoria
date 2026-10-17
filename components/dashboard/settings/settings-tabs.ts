/** Shared (server + client) settings tab definitions. */
export type SettingsTab = "autonomy" | "workspace" | "account" | "team" | "notifications" | "permissions" | "security";

export const settingsTabs: { value: SettingsTab; label: string }[] = [
  { value: "autonomy", label: "Autonomy & safety" },
  { value: "workspace", label: "Company" },
  { value: "account", label: "Account" },
  { value: "team", label: "Team & roles" },
  { value: "notifications", label: "Notifications" },
  { value: "permissions", label: "Tool permissions" },
  { value: "security", label: "Privacy & security" },
];

export function isSettingsTab(v: unknown): v is SettingsTab {
  return settingsTabs.some((t) => t.value === v);
}

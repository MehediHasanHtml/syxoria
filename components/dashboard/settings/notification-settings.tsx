"use client";

import { useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferences } from "@/services/user";
import type { NotificationPreferences } from "@/types";
import { FormStatus, type SubmitState } from "./form-status";
import { SettingsSection } from "./settings-section";

const options: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "insightAlerts", label: "New insights", description: "When Nexo finds something that needs your attention." },
  { key: "projectUpdates", label: "Project updates", description: "Milestones, risks and status changes on projects you own." },
  { key: "weeklyDigest", label: "Weekly digest", description: "A calm summary every Monday at 8:00." },
  { key: "productNews", label: "Product news", description: "Occasional updates about new capabilities." },
];

/** Autosaves each toggle; rolls back if saving fails. */
export function NotificationSettings({ initial }: { initial: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const seq = useRef(0);

  async function toggle(key: keyof NotificationPreferences, value: boolean) {
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const id = ++seq.current;
    setState({ status: "saving" });
    try {
      await updateNotificationPreferences(next);
      if (id === seq.current) setState({ status: "saved", message: "Preferences saved." });
    } catch {
      setPrefs(prev);
      setState({ status: "error", message: "Could not save. Your previous settings were restored." });
    }
  }

  return (
    <SettingsSection title="Email notifications" description="Choose what reaches your inbox. Changes save automatically.">
      <div className="divide-y divide-line rounded-lg border border-line bg-surface/40">
        {options.map((o) => (
          <Switch key={o.key} className="p-4" label={o.label} description={o.description} checked={prefs[o.key]} onCheckedChange={(v) => toggle(o.key, v)} />
        ))}
        <Switch className="p-4" label="SMS alerts" description="Available on the Enterprise plan." checked={false} onCheckedChange={() => {}} disabled />
      </div>
      <FormStatus className="mt-3" state={state} />
    </SettingsSection>
  );
}

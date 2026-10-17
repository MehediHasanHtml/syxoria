"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Mark } from "@/components/dashboard/ws/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TeamMember } from "@/types/workspace";
import { SettingsSection } from "./settings-section";

const ROLES: { id: TeamMember["role"]; does: string }[] = [
  { id: "Owner", does: "Everything, including billing, autonomy and the kill switch." },
  { id: "Admin", does: "All areas and settings, connects tools, can approve actions." },
  { id: "Member", does: "Works in their areas, sees what Syxoria prepares for them." },
  { id: "Viewer", does: "Reads briefings and reports. Changes nothing." },
];

/**
 * Team & roles: who has access, with what role, and who may approve what Syxoria prepares. Inviting
 * here is a preview: nobody receives an email.
 */
export function TeamSettings({ team }: { team: TeamMember[] }) {
  const [members, setMembers] = useState(team);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Member");
  const [sent, setSent] = useState<string | null>(null);
  const set = (id: string, patch: Partial<TeamMember>) => setMembers((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSent(`Preview: an invitation to ${email} as ${role} would go out now.`);
    setEmail("");
  };

  return (
    <>
      <SettingsSection title="Team members" description="Who works in Northfield Studio’s workspace, and who may approve Syxoria’s actions.">
        <ul className="divide-y divide-line rounded-lg border border-line">
          {members.map((m) => (
            <li key={m.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8.5rem] sm:items-center">
              <span className="flex min-w-0 items-center gap-3">
                <Mark name={m.name} tone={m.role === "Owner" ? "emerald" : undefined} />
                <span className="min-w-0">
                  <span className="block text-[13px] text-fg">
                    {m.name} <span className="text-fg-3">· {m.title}</span>
                  </span>
                  <span className="block truncate text-[12px] text-fg-3">
                    {m.email} · {m.access} · active {m.lastActive}
                  </span>
                </span>
              </span>
              <label className="ws-select ws-select--full">
                <span className="sr-only">Role of {m.name}</span>
                <select value={m.role} disabled={m.role === "Owner"} onChange={(e) => set(m.id, { role: e.target.value as TeamMember["role"] })}>
                  {ROLES.map((r) => (
                    <option key={r.id}>{r.id}</option>
                  ))}
                </select>
              </label>
              <Switch
                className="sm:col-span-2"
                checked={m.approves}
                disabled={m.role === "Owner" || m.role === "Viewer"}
                onCheckedChange={(v) => set(m.id, { approves: v })}
                label="May approve actions"
                description={m.role === "Viewer" ? "Viewers never approve." : m.role === "Owner" ? "The owner always may." : "Approvals for their own areas only."}
              />
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title="Invite someone" description="They join with the role you choose. You can change it at any time.">
        <form onSubmit={onInvite} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[14rem] flex-1">
            <span className="mb-1.5 block text-[12.5px] text-fg-3">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@northfield.co" className="ws-input" />
          </label>
          <label className="ws-select">
            <span className="sr-only">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as TeamMember["role"])}>
              {ROLES.filter((r) => r.id !== "Owner").map((r) => (
                <option key={r.id}>{r.id}</option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm" disabled={!email.includes("@")}>
            <Send aria-hidden="true" />
            Send the invitation
          </Button>
        </form>
        {sent && <p className="ax-preview">{sent}</p>}
      </SettingsSection>

      <SettingsSection title="Roles" description="What each role may do.">
        <dl className="divide-y divide-line rounded-lg border border-line">
          {ROLES.map((r) => (
            <div key={r.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
              <dt className="text-[13px] text-fg">{r.id}</dt>
              <dd className="text-[13px] text-fg-2">{r.does}</dd>
            </div>
          ))}
        </dl>
      </SettingsSection>
    </>
  );
}

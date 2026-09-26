"use client";

import { Laptop, Smartphone, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { simulateLatency } from "@/services/_client";
import type { Workspace } from "@/types";
import { FormStatus, type SubmitState } from "./form-status";
import { SettingsSection } from "./settings-section";

function strength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score: s as 0 | 1 | 2 | 3 | 4, label: labels[s] };
}

export function SecuritySettings({ workspace }: { workspace: Workspace }) {
  return (
    <>
      <PasswordForm />
      <TwoFactor />
      <Sessions />
      <DangerZone workspace={workspace} />
    </>
  );
}

function PasswordForm() {
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v, string>>>({});
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const s = strength(v.next);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (!v.current) err.current = "Enter your current password.";
    if (v.next.length < 10) err.next = "Use at least 10 characters.";
    else if (s.score < 3) err.next = "Add upper-case letters, numbers or symbols.";
    if (v.confirm !== v.next) err.confirm = "Passwords don’t match.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setState({ status: "saving" });
    await simulateLatency(); // TODO(auth): call the password-change Server Action
    setV({ current: "", next: "", confirm: "" });
    setState({ status: "saved", message: "Password updated. Other sessions were signed out." });
  }

  const saving = state.status === "saving";
  return (
    <SettingsSection title="Password" description="Use a long, unique password. A password manager helps.">
      <form noValidate onSubmit={onSubmit} className="grid gap-5">
        <Field label="Current password" error={errors.current}>
          <Input type="password" autoComplete="current-password" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} disabled={saving} />
        </Field>
        <Field label="New password" error={errors.next}>
          <Input type="password" autoComplete="new-password" value={v.next} onChange={(e) => setV({ ...v, next: e.target.value })} disabled={saving} />
        </Field>
        {v.next && (
          <div className="-mt-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= s.score ? (s.score <= 1 ? "bg-negative" : s.score === 2 ? "bg-caution" : "bg-positive") : "bg-line-strong",
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-fg-3">Strength: {s.label}</p>
          </div>
        )}
        <Field label="Confirm new password" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} disabled={saving} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" loading={saving} loadingLabel="Updating">
            Update password
          </Button>
          <FormStatus state={state} />
        </div>
      </form>
    </SettingsSection>
  );
}

function TwoFactor() {
  const [enabled, setEnabled] = useState(true);
  return (
    <SettingsSection title="Two-factor authentication" description="Protect your account with a second step at sign-in.">
      <div className="rounded-lg border border-line bg-surface/40 p-4">
        <Switch
          label="Authenticator app"
          description={enabled ? "Enabled · last used today" : "Disabled — we strongly recommend turning this on."}
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
    </SettingsSection>
  );
}

function Sessions() {
  const [sessions, setSessions] = useState([
    { id: "s1", device: "MacBook Pro · Safari", where: "Paris, FR", current: true, icon: Laptop },
    { id: "s2", device: "iPhone · Syxoria app", where: "Paris, FR", current: false, icon: Smartphone },
    { id: "s3", device: "Windows · Chrome", where: "Lyon, FR", current: false, icon: Laptop },
  ]);
  const [pending, setPending] = useState<string | null>(null);

  async function revoke(id: string) {
    setPending(id);
    await simulateLatency(500); // TODO(auth): revoke session
    setSessions((list) => list.filter((s) => s.id !== id));
    setPending(null);
  }

  return (
    <SettingsSection title="Active sessions" description="Devices currently signed in to your account.">
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface/40">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 p-4">
            <s.icon className="size-5 shrink-0 text-fg-3" strokeWidth={1.5} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-fg">{s.device}</p>
              <p className="text-xs text-fg-3">{s.where}</p>
            </div>
            {s.current ? (
              <Badge tone="positive">This device</Badge>
            ) : (
              <Button size="sm" variant="ghost" loading={pending === s.id} loadingLabel="Signing out" disabled={pending !== null} onClick={() => revoke(s.id)}>
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}

function DangerZone({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const matches = confirm === workspace.name;

  async function onDelete() {
    setState({ status: "saving" });
    await simulateLatency(900);
    // Destructive actions are intentionally not simulated as success.
    setState({ status: "error", message: "Workspace deletion isn’t connected yet. TODO(api): DELETE /workspace." });
  }

  return (
    <SettingsSection title="Danger zone" description="Irreversible actions. Proceed with care.">
      <div className="flex flex-col gap-4 rounded-lg border border-negative/30 bg-negative-soft/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-fg">
            <TriangleAlert className="size-4 text-negative" aria-hidden="true" /> Delete workspace
          </p>
          <p className="mt-1 text-[13px] text-fg-3">Permanently removes all projects, automations and history.</p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete workspace
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirm("");
          setState({ status: "idle" });
        }}
        size="sm"
        title="Delete this workspace?"
        description={
          <>
            This cannot be undone. Type <span className="font-medium text-fg">{workspace.name}</span> to confirm.
          </>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={state.status === "saving"}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!matches} loading={state.status === "saving"} loadingLabel="Deleting" onClick={onDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <Field label="Workspace name">
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder={workspace.name} />
        </Field>
        <FormStatus className="mt-3" state={state} />
      </Dialog>
    </SettingsSection>
  );
}

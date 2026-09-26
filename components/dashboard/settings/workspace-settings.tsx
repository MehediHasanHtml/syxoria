"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { updateWorkspace } from "@/services/user";
import type { Workspace } from "@/types";
import { FormStatus, type SubmitState } from "./form-status";
import { SettingsSection } from "./settings-section";

export function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  const [name, setName] = useState(workspace.name);
  const [region, setRegion] = useState(workspace.region);
  const [savedName, setSavedName] = useState(workspace.name);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const dirty = name !== savedName || region !== workspace.region;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Workspace name must have at least 2 characters.");
      return;
    }
    setError(null);
    setState({ status: "saving" });
    try {
      await updateWorkspace({ name, region });
      setSavedName(name);
      setState({ status: "saved", message: "Workspace updated." });
    } catch {
      setState({ status: "error", message: "Could not update the workspace." });
    }
  }

  return (
    <>
      <SettingsSection title="General" description="Name and data location for this workspace.">
        <form noValidate onSubmit={onSubmit} className="grid gap-5">
          <Field label="Workspace name" error={error}>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={state.status === "saving"} />
          </Field>
          <Field label="Data region" hint="Changing region schedules a migration outside working hours.">
            <Select value={region} onChange={(e) => setRegion(e.target.value as Workspace["region"])} disabled={state.status === "saving"}>
              <option value="eu-west">Europe (Paris, Frankfurt)</option>
              <option value="us-east">United States (Virginia)</option>
            </Select>
          </Field>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" loading={state.status === "saving"} loadingLabel="Saving" disabled={!dirty}>
              Save changes
            </Button>
            <FormStatus state={state} />
          </div>
        </form>
      </SettingsSection>

      <SettingsSection title="Plan & seats" description="Your subscription and usage.">
        <div className="rounded-lg border border-line bg-surface/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <p className="text-[15px] font-medium capitalize text-fg">{workspace.plan}</p>
              <Badge tone="accent">Current plan</Badge>
            </div>
            <ButtonLink href="/#pricing" variant="outline" size="sm">
              Compare plans
            </ButtonLink>
          </div>
          <div className="mt-5 flex items-center justify-between text-[13px] text-fg-3">
            <span>Seats used</span>
            <span className="tabular text-fg-2">
              {workspace.seats.used} / {workspace.seats.total}
            </span>
          </div>
          <Progress value={(workspace.seats.used / workspace.seats.total) * 100} label="Seats used" size="sm" tone="accent" className="mt-2" />
          <p className="mt-4 text-xs text-fg-3">Billing is managed by your payment provider. TODO(billing): link the customer portal.</p>
        </div>
      </SettingsSection>
    </>
  );
}

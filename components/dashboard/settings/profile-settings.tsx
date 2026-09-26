"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ServiceError } from "@/services/_client";
import { updateProfile } from "@/services/user";
import type { User } from "@/types";
import { FormStatus, type SubmitState } from "./form-status";
import { SettingsSection } from "./settings-section";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Values = { name: string; email: string; title: string };

function validate(v: Values) {
  const e: Partial<Record<keyof Values, string>> = {};
  if (!v.name.trim()) e.name = "Your name is required.";
  if (!EMAIL.test(v.email)) e.email = "Enter a valid email address.";
  if (v.title.length > 60) e.title = "Keep it under 60 characters.";
  return e;
}

export function ProfileSettings({ user }: { user: User }) {
  const initial: Values = { name: user.name, email: user.email, title: user.title ?? "" };
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (state.status !== "idle") setState({ status: "idle" });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate(values);
    setErrors(v);
    if (Object.keys(v).length) return;
    setState({ status: "saving" });
    try {
      await updateProfile(values);
      setSaved(values);
      setState({ status: "saved", message: "Profile updated." });
    } catch (err) {
      const message = err instanceof ServiceError ? err.message : "Could not save your profile.";
      if (err instanceof ServiceError && err.code === "validation") setErrors({ email: message });
      setState({ status: "error", message });
    }
  }

  const saving = state.status === "saving";

  return (
    <SettingsSection title="Profile" description="How you appear to your team. Tip: an email ending in @example.invalid shows the server error state.">
      <form noValidate onSubmit={onSubmit} className="grid gap-5">
        <div className="flex items-center gap-4">
          <Avatar initials={user.initials} name={values.name || user.name} size="lg" />
          <div className="text-[13px] text-fg-3">
            <p className="text-fg">{values.name || "—"}</p>
            <p className="capitalize">{user.role}</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <Input value={values.name} onChange={set("name")} autoComplete="name" disabled={saving} />
          </Field>
          <Field label="Job title" optional error={errors.title}>
            <Input value={values.title} onChange={set("title")} autoComplete="organization-title" disabled={saving} />
          </Field>
        </div>
        <Field label="Email" error={errors.email} hint="We’ll send a confirmation link if you change it.">
          <Input type="email" value={values.email} onChange={set("email")} autoComplete="email" disabled={saving} />
        </Field>
        <Field label="Role" hint="Only workspace owners can change roles.">
          <Input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled readOnly />
        </Field>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" loading={saving} loadingLabel="Saving" disabled={!dirty}>
            Save changes
          </Button>
          <Button
            variant="ghost"
            disabled={!dirty || saving}
            onClick={() => {
              setValues(saved);
              setErrors({});
              setState({ status: "idle" });
            }}
          >
            Discard
          </Button>
          <FormStatus state={state} />
        </div>
      </form>
    </SettingsSection>
  );
}

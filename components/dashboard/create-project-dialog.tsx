"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { productModules } from "@/lib/mock-data/modules";
import { REFERENCE_NOW } from "@/lib/mock-data/series";
import { createProject } from "@/services/projects";
import { ServiceError } from "@/services/_client";
import type { CreateProjectInput, ModuleKey, Project } from "@/types";

type Errors = Partial<Record<keyof CreateProjectInput, string>>;

const empty: CreateProjectInput = { name: "", description: "", module: "volt", dueDate: null };

export function validateProject(input: CreateProjectInput): Errors {
  const errors: Errors = {};
  const name = input.name.trim();
  if (!name) errors.name = "Give your project a name.";
  else if (name.length < 3) errors.name = "Use at least 3 characters.";
  else if (name.length > 60) errors.name = "Keep it under 60 characters.";
  if (input.description.length > 240) errors.description = "Keep the description under 240 characters.";
  if (input.dueDate && input.dueDate < REFERENCE_NOW.slice(0, 10)) errors.dueDate = "The due date must be in the future.";
  return errors;
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
  ownerId: string;
}) {
  const [values, setValues] = useState<CreateProjectInput>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CreateProjectInput, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof CreateProjectInput>(key: K, value: CreateProjectInput[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validateProject(next));
  };

  function close() {
    if (submitting) return;
    onClose();
    // reset after the exit transition
    window.setTimeout(() => {
      setValues(empty);
      setErrors({});
      setTouched({});
      setFormError(null);
    }, 300);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateProject(values);
    setErrors(v);
    setTouched({ name: true, description: true, dueDate: true, module: true });
    if (Object.keys(v).length) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const project = await createProject(values, ownerId);
      onCreated(project);
      setSubmitting(false);
      close();
    } catch (err) {
      setFormError(err instanceof ServiceError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const nameOk = touched.name && !errors.name && values.name.trim().length >= 3;

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New project"
      description="Projects group the automations, goals and insights that move one outcome forward."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" loading={submitting} loadingLabel="Creating">
            Create project
          </Button>
        </>
      }
    >
      <form id="create-project-form" noValidate onSubmit={onSubmit} className="grid gap-5">
        {formError && (
          <p role="alert" className="rounded-md border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-[13px] text-negative">
            {formError}
          </p>
        )}
        <Field label="Project name" error={touched.name ? errors.name : null} success={nameOk ? "Looks good." : null} hint="Tip: type “error” to preview the failure state.">
          <Input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => {
              setTouched((t) => ({ ...t, name: true }));
              setErrors(validateProject(values));
            }}
            placeholder="e.g. Client onboarding"
            autoFocus
            required
            maxLength={80}
            disabled={submitting}
          />
        </Field>
        <Field label="Description" optional error={touched.description ? errors.description : null} hint={`${values.description.length}/240`}>
          <Textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            placeholder="What outcome should this project move?"
            disabled={submitting}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Lead module">
            <Select value={values.module} onChange={(e) => set("module", e.target.value as ModuleKey)} disabled={submitting}>
              {productModules.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name} — {m.role}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date" optional error={touched.dueDate ? errors.dueDate : null}>
            <Input
              type="date"
              value={values.dueDate ?? ""}
              onChange={(e) => set("dueDate", e.target.value || null)}
              onBlur={() => {
                setTouched((t) => ({ ...t, dueDate: true }));
                setErrors(validateProject(values));
              }}
              disabled={submitting}
              className="[color-scheme:dark]"
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}

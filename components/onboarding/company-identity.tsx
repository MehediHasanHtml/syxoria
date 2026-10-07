"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { company as copy } from "@/content/onboarding";
import { formatDate } from "@/lib/format";
import { formatCompanyNumber } from "@/lib/onboarding/siren";
import type { CompanyEditableField, CompanyProfile } from "@/types";
import { OnbButton } from "./onboarding-button";
import { BigInput, QuietButton, rise, StageHeading } from "./primitives";

type Row = { label: string; value: string; field?: CompanyEditableField; mono?: boolean };

/**
 * "We found your company." Not a form: Syxoria did the work, the user only confirms. The identity
 * arrives first, is validated (the Core reacts, emerald marks what the register vouches for),
 * then the supporting facts follow. Correcting is a separate, deliberate path.
 */
export function CompanyIdentity({
  company,
  saving,
  onConfirm,
  onReject,
  onValidated,
}: {
  company: CompanyProfile;
  saving: boolean;
  onConfirm: (c: CompanyProfile) => void;
  onReject: () => void;
  /** The identity has just been validated — the Core reacts */
  onValidated: () => void;
}) {
  const [draft, setDraft] = useState(company);
  const [editing, setEditing] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => {
      setValidated(true);
      onValidated();
    }, still ? 0 : 700);
    return () => clearTimeout(t);
    // once, when the identity first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: Row[] = [
    { label: "Registered office", value: `${draft.address} ${draft.city}`.trim(), field: "address" },
    { label: "Activity", value: `${draft.activity.label}${draft.activity.code ? ` · ${draft.activity.code}` : ""}` },
    { label: "Created", value: formatDate(draft.founded) },
    { label: "Size", value: draft.headcount, field: "headcount" },
    ...(draft.director ? [{ label: "Director", value: draft.director }] : []),
    { label: draft.siret ? "SIRET" : "SIREN", value: formatCompanyNumber(draft.siret ?? draft.siren), mono: true },
  ];

  if (editing) return <CompanyCorrection company={draft} onCancel={() => setEditing(false)} onSave={(next) => (setDraft(next), setEditing(false))} />;

  return (
    <div className="w-full max-w-[40rem]">
      <StageHeading lead={copy.found.lead} accent={copy.found.accent}>
        {copy.foundBody}
      </StageHeading>

      <section aria-label="Your company, as the register describes it" className="onb-identity onb-rise mt-8" data-validated={validated || undefined} style={rise(2)}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-3 font-display text-[clamp(1.6rem,1.3rem+1vw,2.1rem)] font-light leading-tight tracking-[-0.02em] text-fg">
              {draft.name}
              {draft.edited.includes("name") && <EditedTag />}
            </p>
            <p className="mt-1 text-[12.5px] uppercase tracking-[0.08em] text-fg-3">
              {draft.legalName} · {draft.legalForm.split(" · ")[0]}
            </p>
          </div>
          <p className="onb-identity__seal flex items-center gap-2 text-[12.5px] text-accent-strong" role="status">
            <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-accent-soft ring-1 ring-accent-line">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {validated ? copy.verified : <span className="sr-only">Verifying</span>}
          </p>
        </div>

        {validated && (
          <dl className="mt-6 grid gap-x-8 border-t border-white/[0.07] pt-2 sm:grid-cols-2">
            {rows.map((r, i) => {
              const edited = r.field && draft.edited.includes(r.field);
              return (
                <div key={r.label} className="onb-rise border-b border-white/[0.05] py-3" style={rise(i + 1)}>
                  <dt className="text-[12px] text-fg-3">{r.label}</dt>
                  <dd className="mt-1 flex items-baseline gap-2 text-[14px] text-fg">
                    <span className={r.mono ? "tabular tracking-[0.04em]" : undefined}>{r.value}</span>
                    {edited ? (
                      <EditedTag />
                    ) : (
                      <Check aria-label="from the register" className="onb-verified size-3 shrink-0 translate-y-px text-accent-strong" strokeWidth={3} style={rise(i + 3)} />
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </section>

      <div className="onb-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" style={rise(validated ? rows.length + 2 : 3)}>
        <OnbButton onClick={() => onConfirm(draft)} busy={saving} disabled={!validated}>
          {saving ? "Saving" : "This is my company"}
        </OnbButton>
        <QuietButton onClick={() => setEditing(true)} disabled={saving || !validated}>
          Something is incorrect
        </QuietButton>
        <QuietButton onClick={onReject} disabled={saving}>
          This isn’t my company
        </QuietButton>
      </div>
    </div>
  );
}

/** Only after "something is incorrect": the few things the register can't vouch for */
function CompanyCorrection({ company, onSave, onCancel }: { company: CompanyProfile; onSave: (c: CompanyProfile) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: company.name, address: `${company.address} ${company.city}`.trim(), headcount: company.headcount });

  function save() {
    const edited = new Set(company.edited);
    const next = { ...company };
    if (form.name.trim() && form.name.trim() !== company.name) {
      next.name = form.name.trim();
      edited.add("name");
    }
    const where = form.address.trim();
    if (where && where !== `${company.address} ${company.city}`.trim()) {
      // "18 rue de Paradis, 75010 Paris" → the last word is the city
      const at = where.lastIndexOf(" ");
      next.address = at > 0 ? where.slice(0, at) : where;
      next.city = at > 0 ? where.slice(at + 1) : company.city;
      edited.add("address");
    }
    if (form.headcount !== company.headcount) {
      next.headcount = form.headcount;
      edited.add("headcount");
    }
    next.edited = [...edited];
    onSave(next);
  }

  return (
    <div className="w-full max-w-[34rem]">
      <StageHeading lead={copy.correct.lead} accent={copy.correct.accent}>
        {copy.correctBody}
      </StageHeading>
      <div className="onb-rise mt-8 grid gap-5" style={rise(2)}>
        <Field label="Company name">
          <BigInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
        </Field>
        <Field label="Registered office">
          <BigInput value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </Field>
        <Field label="Size">
          <Select value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))} className="h-12 rounded-lg text-[15px]">
            {copy.headcountBands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <p className="text-[12.5px] text-fg-3">Activity, legal form and registration numbers come from the register and can’t be changed here.</p>
      </div>
      <div className="onb-rise mt-8 flex items-center gap-3" style={rise(3)}>
        <OnbButton onClick={save}>Save corrections</OnbButton>
        <Button size="md" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function EditedTag() {
  return <span className="rounded-xs border border-white/10 px-1.5 py-px font-sans text-[11px] tracking-normal text-fg-3">Corrected by you</span>;
}

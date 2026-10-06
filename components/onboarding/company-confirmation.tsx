"use client";

import { useState } from "react";
import { CoreButton } from "@/components/home/core-button";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { company as copy } from "@/content/onboarding";
import { formatCompanyNumber } from "@/lib/onboarding/siren";
import { formatDate } from "@/lib/format";
import type { CompanyEditableField, CompanyProfile } from "@/types";
import { BigInput, QuietButton, rise, StageHeading } from "./primitives";

type Row = { label: string; value: string; field?: CompanyEditableField };

/**
 * "We found your company." What the register said, revealed a line at a time; one click to
 * confirm, or a correction mode where only what the register can't vouch for is editable.
 */
export function CompanyConfirmation({
  company,
  saving,
  onConfirm,
  onReject,
}: {
  company: CompanyProfile;
  saving: boolean;
  onConfirm: (c: CompanyProfile) => void;
  onReject: () => void;
}) {
  const [draft, setDraft] = useState(company);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: company.name, address: `${company.address} ${company.city}`.trim(), headcount: company.headcount });

  const rows: Row[] = [
    { label: "Registered office", value: `${draft.address} ${draft.city}`.trim(), field: "address" },
    { label: "Activity", value: `${draft.activity.label}${draft.activity.code ? ` · ${draft.activity.code}` : ""}` },
    { label: "Legal form", value: draft.legalForm },
    { label: "Created", value: formatDate(draft.founded) },
    { label: "Size", value: draft.headcount, field: "headcount" },
    ...(draft.director ? [{ label: "Director", value: draft.director }] : []),
    { label: draft.siret ? "SIRET" : "SIREN", value: formatCompanyNumber(draft.siret ?? draft.siren) },
  ];

  function save() {
    const edited = new Set(draft.edited);
    const next = { ...draft };
    if (form.name.trim() && form.name.trim() !== draft.name) {
      next.name = form.name.trim();
      edited.add("name");
    }
    const where = form.address.trim();
    if (where && where !== `${draft.address} ${draft.city}`.trim()) {
      // "18 rue de Paradis, 75010 Paris" → the last word is the city
      const at = where.lastIndexOf(" ");
      next.address = at > 0 ? where.slice(0, at) : where;
      next.city = at > 0 ? where.slice(at + 1) : draft.city;
      edited.add("address");
    }
    if (form.headcount !== draft.headcount) {
      next.headcount = form.headcount;
      edited.add("headcount");
    }
    next.edited = [...edited];
    setDraft(next);
    setEditing(false);
  }

  return (
    <div className="w-full max-w-[36rem]">
      <StageHeading lead={copy.found.lead} accent={copy.found.accent}>
        {editing ? "Correct what isn’t right. The rest comes straight from the register." : copy.foundBody}
      </StageHeading>

      <div className="onb-rise mt-9 border-t border-white/[0.08] pt-7" style={rise(2)}>
        {editing ? (
          <div className="grid gap-5">
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
            <div className="flex gap-2">
              <Button size="md" onClick={save}>
                Save corrections
              </Button>
              <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="onb-rise flex flex-wrap items-baseline gap-x-3 font-display text-[1.75rem] font-light leading-tight tracking-[-0.02em] text-fg" style={rise(3)}>
              {draft.name}
              {draft.edited.includes("name") && <EditedTag />}
            </p>
            <p className="onb-rise mt-1 text-[13px] uppercase tracking-[0.08em] text-fg-3" style={rise(3)}>
              {draft.legalName}
            </p>
            <dl className="mt-6 grid gap-x-6 sm:grid-cols-[10rem_1fr]">
              {rows.map((r, i) => (
                <div key={r.label} className="contents">
                  <dt className="onb-rise pt-3 text-[13px] text-fg-3 sm:border-t sm:border-white/[0.05] sm:py-3" style={rise(4 + i)}>
                    {r.label}
                  </dt>
                  <dd className="onb-rise flex flex-wrap items-baseline gap-x-2.5 border-b border-white/[0.05] pb-3 pt-0.5 text-[14px] text-fg sm:border-b-0 sm:border-t sm:py-3" style={rise(4 + i)}>
                    <span className={r.label === "SIREN" || r.label === "SIRET" ? "tabular tracking-[0.04em]" : undefined}>{r.value}</span>
                    {r.field && draft.edited.includes(r.field) && <EditedTag />}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      {!editing && (
        <div className="onb-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={rise(4 + rows.length)}>
          <CoreButton onClick={() => onConfirm(draft)} busy={saving}>
            {saving ? "Saving" : "Yes, that’s us"}
          </CoreButton>
          <QuietButton onClick={() => setEditing(true)} disabled={saving}>
            Correct something
          </QuietButton>
          <QuietButton onClick={onReject} disabled={saving}>
            Not my company
          </QuietButton>
        </div>
      )}
    </div>
  );
}

function EditedTag() {
  return <span className="rounded-xs border border-white/10 px-1.5 py-px font-sans text-[11px] tracking-normal text-fg-3">Edited by you</span>;
}

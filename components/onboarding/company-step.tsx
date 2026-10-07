"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui/field";
import { company as copy } from "@/content/onboarding";
import { lookupCompany, saveCompany } from "@/services/onboarding";
import type { CompanyProfile } from "@/types";
import { CompanyIdentity } from "./company-identity";
import { CompanySearch } from "./company-search";
import { flowToCore } from "./flow-to-core";
import { OnbButton } from "./onboarding-button";
import { BigInput, Notice, QuietButton, rise, StageHeading } from "./primitives";
import { transition } from "./view-transition";

type Props = {
  welcome: string | null;
  candidate: CompanyProfile | null;
  onSearching: (on: boolean) => void;
  onCandidate: (company: CompanyProfile | null) => void;
  onPulse: () => void;
  onConfirmed: (company: CompanyProfile) => void;
};

/**
 * The company moment: Syxoria finds the company → shows what it found → the user confirms.
 * A number is enough; describing the company by hand is only for when the register can't help.
 */
export function CompanyStep({ welcome, candidate, onSearching, onCandidate, onPulse, onConfirmed }: Props) {
  const [phase, setPhase] = useState<"search" | "found" | "manual">(candidate ? "found" : "search");
  const [retry, setRetry] = useState(false);
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(company: CompanyProfile) {
    setSaving(true);
    setError(null);
    try {
      onConfirmed(await saveCompany(company));
    } catch {
      setSaving(false);
      setError("We couldn’t save your company just now. Please try again.");
    }
  }

  if (phase === "manual") return <ManualCompany number={number} saving={saving} onSubmit={confirm} onBack={() => setPhase("search")} />;

  if (phase === "found" && candidate)
    return (
      <>
        <CompanyIdentity
          company={candidate}
          saving={saving}
          onConfirm={confirm}
          onValidated={onPulse}
          onReject={() =>
            transition(() => {
              onCandidate(null);
              setRetry(true);
              setPhase("search");
            })
          }
        />
        {error && (
          <Notice tone="error" className="mt-6 max-w-[40rem]">
            {error}
          </Notice>
        )}
      </>
    );

  return (
    <CompanySearch
      welcome={welcome}
      retry={retry}
      initial={retry ? "" : number}
      lookup={lookupCompany}
      onSearching={onSearching}
      onIdentified={async (company, from) => {
        // what it found reaches the Core, the memory fills, then the company is presented
        onCandidate(company);
        await flowToCore(from);
        onPulse();
        setTimeout(() => transition(() => setPhase("found")), 650);
      }}
      onManual={(digits) => {
        setNumber(digits);
        setPhase("manual");
      }}
    />
  );
}

/** When the register doesn't know the company: the few things Syxoria can't find itself */
function ManualCompany({ number, saving, onSubmit, onBack }: { number: string; saving: boolean; onSubmit: (c: CompanyProfile) => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [headcount, setHeadcount] = useState(copy.headcountBands[1]);
  const [errors, setErrors] = useState<{ name?: string; city?: string }>({});

  return (
    <form
      noValidate
      className="w-full max-w-[34rem]"
      onSubmit={(e) => {
        e.preventDefault();
        const err: typeof errors = {};
        if (!name.trim()) err.name = "Your company’s name is needed.";
        if (!city.trim()) err.city = "Where is it based?";
        setErrors(err);
        if (Object.keys(err).length) return;
        onSubmit({
          siren: number.slice(0, 9),
          siret: number.length === 14 ? number : null,
          name: name.trim(),
          legalName: name.trim().toUpperCase(),
          legalForm: "Not specified",
          address: "",
          city: city.trim(),
          activity: { code: "", label: activity.trim() || "Not specified" },
          sector: activity.trim().toLowerCase() || "company",
          founded: new Date().toISOString(),
          headcount,
          director: null,
          source: "manual",
          edited: [],
        });
      }}
    >
      <StageHeading lead={copy.manual.lead} accent={copy.manual.accent}>
        {copy.manualBody}
      </StageHeading>
      <div className="mt-8 grid gap-5">
        <div className="onb-rise" style={rise(2)}>
          <Field label="Company name" error={errors.name}>
            <BigInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />
          </Field>
        </div>
        <div className="onb-rise grid gap-5 sm:grid-cols-2" style={rise(3)}>
          <Field label="City" error={errors.city}>
            <BigInput value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
          </Field>
          <Field label="Size">
            <Select value={headcount} onChange={(e) => setHeadcount(e.target.value)} className="h-12 rounded-lg text-[15px]">
              {copy.headcountBands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="onb-rise" style={rise(4)}>
          <Field label="What it does" optional hint="In a few words — “design studio”, “accounting firm”…">
            <BigInput value={activity} onChange={(e) => setActivity(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="onb-rise mt-8 flex flex-wrap items-center gap-6" style={rise(5)}>
        <OnbButton type="submit" busy={saving}>
          {saving ? "Saving" : "Continue"}
        </OnbButton>
        <QuietButton onClick={onBack} disabled={saving}>
          Try another number
        </QuietButton>
      </div>
    </form>
  );
}

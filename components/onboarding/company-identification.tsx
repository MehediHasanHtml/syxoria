"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CoreButton } from "@/components/home/core-button";
import { Field, Select } from "@/components/ui/field";
import { company as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { checkCompanyNumber, digitsOf, formatCompanyNumber } from "@/lib/onboarding/siren";
import { DEMO_COMPANY_NUMBER, lookupCompany, saveCompany } from "@/services/onboarding";
import type { CompanyProfile } from "@/types";
import { CompanyConfirmation } from "./company-confirmation";
import { BigInput, Notice, QuietButton, rise, StageHeading } from "./primitives";

type Phase = "ask" | "looking" | "found" | "missing" | "manual";

const reasons = {
  empty: "Enter your company’s SIREN (9 digits) or SIRET (14 digits).",
  length: "A SIREN has 9 digits, a SIRET 14.",
  checksum: "This number doesn’t look right — check the digits.",
};

/**
 * The company moment: the user gives one number; the system looks it up in the national
 * register and comes back with the company — to confirm, correct, or, if it can't be found,
 * to describe in four fields.
 */
export function CompanyIdentification({ welcome, onConfirmed }: { welcome: string | null; onConfirmed: (company: CompanyProfile) => void }) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [found, setFound] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);

  async function look(raw: string) {
    const check = checkCompanyNumber(raw);
    if (!check.ok) {
      setError(reasons[check.reason]);
      return;
    }
    setError(null);
    setPhase("looking");
    setStep(0);
    // narrate the wait: the steps advance while the register answers
    const timers = [setTimeout(() => setStep(1), 450), setTimeout(() => setStep(2), 1050)];
    try {
      const company = await lookupCompany(digitsOf(raw));
      timers.forEach(clearTimeout);
      setStep(3);
      await new Promise((r) => setTimeout(r, 350));
      if (company) {
        setFound(company);
        setPhase("found");
      } else setPhase("missing");
    } catch {
      timers.forEach(clearTimeout);
      setPhase("ask");
      setError("The register didn’t answer. Nothing is wrong on your side — please try again.");
    }
  }

  async function confirm(company: CompanyProfile) {
    setSaving(true);
    try {
      onConfirmed(await saveCompany(company));
    } catch {
      setSaving(false);
      setError("We couldn’t save your company just now. Please try again.");
    }
  }

  if (phase === "found" && found) {
    return <CompanyConfirmation company={found} saving={saving} onConfirm={confirm} onReject={() => { setPhase("ask"); setFound(null); }} />;
  }
  if (phase === "manual") return <ManualCompany number={digitsOf(value)} saving={saving} onSubmit={confirm} onBack={() => setPhase("ask")} />;

  const looking = phase === "looking";
  return (
    <div className="w-full max-w-[34rem]">
      {welcome && (
        <p className="onb-rise mb-6 font-label text-label uppercase text-accent-strong" role="status">
          {welcome}
        </p>
      )}
      <StageHeading lead={copy.ask.lead} accent={copy.ask.accent}>
        {copy.body}
      </StageHeading>

      <form
        noValidate
        className="onb-rise mt-9"
        style={rise(2)}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          look(value);
        }}
      >
        <Field label={copy.label} error={error}>
          <BigInput
            value={value}
            onChange={(e) => {
              setValue(formatCompanyNumber(e.target.value));
              if (error) setError(null);
            }}
            onBlur={() => {
              const c = checkCompanyNumber(value);
              if (!c.ok && c.reason === "checksum") setError(reasons.checksum);
            }}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="852 379 148"
            disabled={looking}
            className="tabular tracking-[0.06em]"
          />
        </Field>

        {looking ? (
          <ol className="mt-6 grid gap-2.5" aria-live="polite">
            {copy.lookupSteps.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3 text-[13.5px] transition-colors duration-500", i < step ? "text-fg-2" : i === step ? "text-fg" : "text-fg-3/60")}>
                <span aria-hidden="true" className="grid size-4 place-items-center">
                  {i < step ? <Check className="size-3.5 text-accent-strong" /> : <span className={cn("size-1.5 rounded-full", i === step ? "animate-pulse-soft bg-accent-strong" : "bg-white/20")} />}
                </span>
                {s}
                {i === step && "…"}
              </li>
            ))}
          </ol>
        ) : phase === "missing" ? (
          <Notice
            tone="info"
            className="mt-6"
            action={
              <>
                <QuietButton onClick={() => setPhase("manual")} className="text-fg">
                  Describe it myself
                </QuietButton>
              </>
            }
          >
            {copy.notFound}
          </Notice>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <CoreButton type="submit" busy={looking}>
            {looking ? "Looking it up" : "Find my company"}
          </CoreButton>
          {!looking && (
            <QuietButton
              onClick={() => {
                const demo = formatCompanyNumber(DEMO_COMPANY_NUMBER);
                setValue(demo);
                look(demo);
              }}
            >
              {copy.demo}
            </QuietButton>
          )}
        </div>
      </form>
    </div>
  );
}

/** When the register doesn't know the company: the four things the system can't guess */
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
      <div className="mt-9 grid gap-5">
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
      <div className="onb-rise mt-9 flex flex-wrap items-center gap-6" style={rise(5)}>
        <CoreButton type="submit" busy={saving}>
          {saving ? "Saving" : "Continue"}
        </CoreButton>
        <QuietButton onClick={onBack} disabled={saving}>
          Try another number
        </QuietButton>
      </div>
    </form>
  );
}

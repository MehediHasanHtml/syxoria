"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field } from "@/components/ui/field";
import { company as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { checkCompanyNumber, digitsOf, formatCompanyNumber } from "@/lib/onboarding/siren";
import { DEMO_COMPANY_NUMBER } from "@/services/onboarding";
import type { CompanyProfile } from "@/types";
import { OnbButton } from "./onboarding-button";
import { BigInput, Notice, QuietButton, rise, StageHeading } from "./primitives";

const reasons = {
  empty: "Enter your company’s SIREN (9 digits) or SIRET (14 digits).",
  length: "A SIREN has 9 digits, a SIRET 14.",
  checksum: "This number doesn’t look right — check the digits.",
};

/** Where the search is: what is really happening, in order */
export type SearchPhase = "idle" | "reading" | "register" | "identified" | "missing";

type Props = {
  welcome: string | null;
  /** Shown when the user came back from "this isn't my company" */
  retry: boolean;
  initial: string;
  /** Looks the number up; resolves with the company, or null when the register doesn't know it */
  lookup: (digits: string) => Promise<CompanyProfile | null>;
  onSearching: (on: boolean) => void;
  onIdentified: (company: CompanyProfile, from: Element | null) => void;
  onManual: (digits: string) => void;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "Which company will Syxoria work for?" — one number. Searching is a short sequence, not a
 * spinner: the number is read, the register searched (the Core scans), and what it finds fills
 * "What Syxoria knows" before the company is called identified.
 */
export function CompanySearch({ welcome, retry, initial, lookup, onSearching, onIdentified, onManual }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [kind, setKind] = useState<"SIREN" | "SIRET" | null>(null);
  const [name, setName] = useState<string | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function search(raw: string) {
    const check = checkCompanyNumber(raw);
    if (!check.ok) {
      setError(reasons[check.reason]);
      return;
    }
    setError(null);
    setKind(check.kind);
    setPhase("reading");
    onSearching(true);
    try {
      // the number is read (and checked) before anything is asked of the register
      await wait(650);
      if (!alive.current) return;
      setPhase("register");
      const company = await lookup(digitsOf(raw));
      if (!alive.current) return;
      onSearching(false);
      if (!company) {
        setPhase("missing");
        return;
      }
      setName(company.name);
      setPhase("identified");
      onIdentified(company, statusRef.current);
    } catch {
      if (!alive.current) return;
      onSearching(false);
      setPhase("idle");
      setError("The register didn’t answer. Nothing is wrong on your side — please try again.");
    }
  }

  const working = phase === "reading" || phase === "register" || phase === "identified";
  const steps: { id: SearchPhase; label: string }[] = [
    { id: "reading", label: copy.search.reading },
    { id: "register", label: copy.search.register },
    { id: "identified", label: name ? `${copy.search.identified} — ${name}` : copy.search.identified },
  ];
  const at = steps.findIndex((s) => s.id === phase);

  return (
    <div className="w-full max-w-[34rem]">
      {welcome && (
        <p className="onb-rise mb-5 font-label text-label uppercase text-accent-strong" role="status">
          {welcome}
        </p>
      )}
      <StageHeading lead={copy.ask.lead} accent={copy.ask.accent}>
        {copy.body}
      </StageHeading>

      <form
        noValidate
        className="onb-rise mt-8"
        style={rise(2)}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          search(value);
        }}
      >
        {retry && phase === "idle" && !error && (
          <Notice tone="info" className="mb-5">
            Understood — let’s try another number.
          </Notice>
        )}
        <Field label={copy.label} error={error}>
          <div className="onb-search relative" data-phase={phase}>
            <BigInput
              value={value}
              onChange={(e) => {
                setValue(formatCompanyNumber(e.target.value));
                if (error) setError(null);
                if (phase === "missing") setPhase("idle");
              }}
              onBlur={() => {
                const c = checkCompanyNumber(value);
                if (!c.ok && c.reason === "checksum") setError(reasons.checksum);
              }}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              placeholder="852 379 148"
              disabled={working}
              className="tabular pr-24 text-[17px] tracking-[0.08em]"
            />
            {kind && working && (
              <span className="onb-pop absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-[11.5px] uppercase tracking-[0.12em] text-accent-strong">
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                {kind}
              </span>
            )}
            {/* the search, as a line of the Core's light under the number */}
            <span aria-hidden="true" className="onb-search__line" />
          </div>
        </Field>

        {/* what is happening — each step names exactly what was done */}
        <div className="mt-4 min-h-[1.5rem]" aria-live="polite">
          {working && (
            <p ref={statusRef} key={phase} className="onb-word flex items-center gap-2.5 text-[13.5px] text-fg-2">
              <span aria-hidden="true" className="grid size-4 place-items-center">
                {phase === "identified" ? <Check className="size-3.5 text-accent-strong" strokeWidth={2.5} /> : <span className="size-1.5 animate-pulse-soft rounded-full bg-accent-strong" />}
              </span>
              <span className={phase === "identified" ? "text-fg" : undefined}>
                {steps[at].label}
                {phase !== "identified" && "…"}
              </span>
              <span aria-hidden="true" className="ml-1 flex gap-1">
                {steps.map((s, i) => (
                  <span key={s.id} className={cn("h-px w-3 transition-colors duration-500", i <= at ? "bg-accent-strong" : "bg-white/15")} />
                ))}
              </span>
            </p>
          )}
          {phase === "missing" && (
            <Notice
              tone="info"
              action={
                <QuietButton onClick={() => onManual(digitsOf(value))} className="text-fg">
                  Describe it myself
                </QuietButton>
              }
            >
              {copy.notFound}
            </Notice>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <OnbButton type="submit" busy={working}>
            {working ? "Finding your company" : "Find my company"}
          </OnbButton>
          {!working && (
            <QuietButton
              onClick={() => {
                const demo = formatCompanyNumber(DEMO_COMPANY_NUMBER);
                setValue(demo);
                search(demo);
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

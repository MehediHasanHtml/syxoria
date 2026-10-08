"use client";

import { Lock, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/home/sheet";
import { autonomy as copy } from "@/content/onboarding";
import { effectiveMode } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, AutonomyPolicy, Mandate, PermissionMode } from "@/types";
import { AutonomyScenario } from "./autonomy-scenario";
import { AutonomySelector } from "./autonomy-selector";
import { OnbButton } from "./onboarding-button";
import { PermissionControl } from "./permission-control";
import { Notice, QuietButton, rise, StageHeading } from "./primitives";

type Props = {
  policy: AutonomyPolicy;
  initial: Mandate | null;
  saving: boolean;
  error: string | null;
  onLevel: (l: AutonomyLevel) => void;
  onConfirm: (m: Mandate) => void;
  onBack: () => void;
};

/**
 * The mandate, kept to what the decision needs, in the order it is made: choose a mode → see what
 * it gives you (what it now takes off your hands, and what still always comes to you) → watch it
 * play out on one real situation → give the mandate. Everything else — action-by-action control,
 * the hard limits no mode crosses — waits in a sheet for those who want it.
 */
export function AutonomyStep({ policy, initial, saving, error, onLevel, onConfirm, onBack }: Props) {
  const [mandate, setMandate] = useState<Mandate>(initial ?? { level: policy.recommended, overrides: {} });
  const [detailed, setDetailed] = useState(false);
  const level = policy.levels.find((l) => l.id === mandate.level)!;

  // only what changes with the level is worth listing — reading the data is always on
  const acting = policy.rules.filter((r) => r.group !== "understand");
  const modeOf = (id: string) => effectiveMode(policy.rules.find((r) => r.id === id)!, mandate);
  const auto = acting.filter((r) => modeOf(r.id) === "auto");
  const ask = acting.filter((r) => modeOf(r.id) === "ask");
  const adjusted = Object.keys(mandate.overrides).length;

  // what this mode adds to the one before it — the value it brings, at a glance
  const index = policy.levels.findIndex((l) => l.id === mandate.level);
  const before = policy.levels[index - 1]?.id;
  const gained = (id: string) => before !== undefined && policy.rules.find((r) => r.id === id)!.defaults[before] !== "auto";

  const setLevel = (l: AutonomyLevel) => {
    setMandate((m) => ({ ...m, level: l }));
    onLevel(l);
  };
  const setMode = (id: string, mode: PermissionMode) =>
    setMandate((m) => {
      const overrides = { ...m.overrides };
      const rule = policy.rules.find((r) => r.id === id)!;
      // a choice equal to the level's own default is no longer an override
      if (rule.defaults[m.level] === mode) delete overrides[id];
      else overrides[id] = mode;
      return { ...m, overrides };
    });

  return (
    <div className="w-full max-w-[52rem]">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.promise}
      </StageHeading>

      {/* 1 — the choice */}
      <div className="onb-rise mt-7 tight:mt-5" style={rise(2)}>
        <AutonomySelector policy={policy} level={mandate.level} onChange={setLevel} />
      </div>

      {/* 2 — what it gives you: the value in one sentence, then exactly what it takes on and what stays yours */}
      <div key={level.id} className="onb-rise mt-6 tight:mt-4" style={rise(3)} aria-live="polite">
        <p className="onb-word max-w-[46rem] text-[15px] leading-relaxed text-fg tight:text-[14px]">{level.summary}</p>
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 tight:mt-2.5">
          <span className="mr-2 flex items-center gap-2 text-[12.5px] text-fg-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-strong shadow-[0_0_8px_var(--core-glow)]" />
            {copy.auto}
          </span>
          {auto.map((r) => (
            <span key={r.id} className={gained(r.id) ? "onb-chip onb-chip--auto onb-chip--gained" : "onb-chip onb-chip--auto"}>
              {r.label}
              {gained(r.id) && <span className="sr-only"> (new in {level.name})</span>}
            </span>
          ))}
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-snug text-fg-3">
          <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="text-fg-2">{copy.ask}:</span> {ask.map((r) => r.label.toLowerCase()).join(", ")}.
          </span>
        </p>
      </div>

      {/* 3 — the chosen mode, played out on one real situation */}
      <div className="onb-rise mt-6 rounded-xl border border-white/[0.06] bg-white/[0.012] px-5 py-4 sm:px-6 tight:mt-4 tight:py-3" style={rise(4)}>
        <AutonomyScenario subject={policy.scenarioSubject} level={level} />
      </div>

      {error && (
        <Notice tone="error" className="mt-6">
          {error}
        </Notice>
      )}

      {/* 4 — the mandate */}
      <div className="onb-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 tight:mt-4" style={rise(6)}>
        <OnbButton onClick={() => onConfirm(mandate)} busy={saving}>
          {saving ? "Preparing your first briefing" : `Give Syxoria ${/^[aeiou]/i.test(level.name) ? "an" : "a"} ${level.name.toLowerCase()} mandate`}
        </OnbButton>
        <QuietButton onClick={() => setDetailed(true)} disabled={saving}>
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {copy.adjust}
          {adjusted > 0 && <span className="text-fg-3"> · {adjusted} adjusted</span>}
        </QuietButton>
        <QuietButton onClick={onBack} disabled={saving}>
          Back
        </QuietButton>
      </div>

      <Sheet open={detailed} onClose={() => setDetailed(false)} label={copy.adjust} header={`${level.name} mandate`}>
        <p className="text-[13.5px] leading-relaxed text-fg-2">Every action Syxoria takes is logged. You can change this mandate any time in Settings.</p>
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-fg-3">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="text-fg-2">{copy.never}:</span> {policy.never.map((n) => n.toLowerCase()).join(", ")}.
          </span>
        </p>
        {(["understand", "prepare", "act"] as const).map((g) => (
          <section key={g} aria-labelledby={`grp-${g}`} className="mt-7">
            <h3 id={`grp-${g}`} className="font-label text-label uppercase text-fg-3">
              {copy.groups[g]}
            </h3>
            <div className="mt-1 divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {policy.rules
                .filter((r) => r.group === g)
                .map((r) => (
                  <PermissionControl key={r.id} rule={r} mode={modeOf(r.id)} onChange={(m) => setMode(r.id, m)} />
                ))}
            </div>
          </section>
        ))}
        {adjusted > 0 && (
          <QuietButton className="mt-6" onClick={() => setMandate((m) => ({ ...m, overrides: {} }))}>
            Back to the {level.name} defaults
          </QuietButton>
        )}
      </Sheet>
    </div>
  );
}


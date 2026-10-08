"use client";

import { Lock, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/home/sheet";
import { autonomy as copy } from "@/content/onboarding";
import { effectiveMode } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, AutonomyPolicy, Mandate, PermissionMode } from "@/types";
import { AutonomyScenario } from "./autonomy-scenario";
import { AutonomySelector, type LevelReach } from "./autonomy-selector";
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
 * The mandate, read in the order a decision is made: choose how much Syxoria does on its own →
 * see exactly what that permits (what it does by itself, what it asks first, what it never does)
 * → watch it play out on one real situation → give the mandate. Action-by-action control waits
 * in a sheet for those who want it.
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

  // each level's reach, from the same rules as the lists below (the chosen one with its adjustments)
  const canBeAuto = acting.filter((r) => r.allowed.includes("auto")).length;
  const reach = Object.fromEntries(
    policy.levels.map((l) => {
      const m: Mandate = l.id === mandate.level ? mandate : { level: l.id, overrides: {} };
      return [l.id, { auto: acting.filter((r) => effectiveMode(r, m) === "auto").length, total: acting.length, boundary: canBeAuto } satisfies LevelReach];
    }),
  ) as Record<AutonomyLevel, LevelReach>;

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
      <div className="onb-rise mt-8 tight:mt-5" style={rise(2)}>
        <AutonomySelector policy={policy} level={mandate.level} reach={reach} onChange={setLevel} />
        <p key={level.id} className="onb-word mt-5 max-w-[46rem] text-[14px] leading-relaxed text-fg-2 tight:mt-2.5 tight:text-[13.5px]" aria-live="polite">
          {level.summary}
        </p>
      </div>

      {/* 2 — what it permits, action by action */}
      <div className="onb-rise mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2 tight:mt-3.5" style={rise(3)}>
        <Consequence title={copy.auto} tone="auto" items={auto.map((r) => r.label)} />
        <Consequence title={copy.ask} tone="ask" items={ask.map((r) => r.label)} />
      </div>
      <p className="onb-rise mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-fg-3 tight:mt-2.5" style={rise(4)}>
        <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="text-fg-2">{copy.never}:</span> {policy.never.map((n) => n.toLowerCase()).join(", ")}.
        </span>
      </p>

      {/* 3 — the chosen level, played out on one real situation */}
      <div className="onb-rise mt-6 rounded-xl border border-white/[0.06] bg-white/[0.012] px-5 py-5 sm:px-6 tight:mt-3 tight:py-3" style={rise(5)}>
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

function Consequence({ title, items, tone }: { title: string; items: string[]; tone: "auto" | "ask" }) {
  return (
    <div>
      <h2 className="flex items-center gap-2.5 font-sans text-[13px] text-fg">
        <span aria-hidden="true" className={tone === "auto" ? "size-1.5 rounded-full bg-accent-strong shadow-[0_0_8px_var(--core-glow)]" : "size-1.5 rounded-full border border-fg-2"} />
        {title}
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i} className={tone === "auto" ? "onb-word onb-chip onb-chip--auto" : "onb-word onb-chip"}>
            {i}
          </li>
        ))}
        {items.length === 0 && <li className="text-[13px] text-fg-3">Nothing.</li>}
      </ul>
    </div>
  );
}

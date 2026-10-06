"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";
import { CoreButton } from "@/components/home/core-button";
import { autonomy as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import type { AutonomyLevel, AutonomyPolicy, Mandate, PermissionMode } from "@/types";
import { effectiveMode, PermissionControl } from "./permission-control";
import { Notice, QuietButton, rise, StageHeading } from "./primitives";

type Props = { policy: AutonomyPolicy; initial: Mandate | null; saving: boolean; error: string | null; onConfirm: (m: Mandate) => void; onBack: () => void };

/**
 * The trust moment. One choice — how much the system does on its own — and, always in view,
 * its consequence: what it will do by itself, what it will ask first, what it will never do.
 * Action-by-action control waits behind a disclosure for those who want it.
 */
export function AutonomySettings({ policy, initial, saving, error, onConfirm, onBack }: Props) {
  const [mandate, setMandate] = useState<Mandate>(initial ?? { level: policy.recommended, overrides: {} });
  const [detailed, setDetailed] = useState(false);
  const level = policy.levels.find((l) => l.id === mandate.level)!;
  const index = policy.levels.findIndex((l) => l.id === mandate.level);

  const modeOf = (id: string) => effectiveMode(policy.rules.find((r) => r.id === id)!, mandate);
  const auto = policy.rules.filter((r) => modeOf(r.id) === "auto");
  const ask = policy.rules.filter((r) => modeOf(r.id) === "ask");
  const off = policy.rules.filter((r) => modeOf(r.id) === "off");

  const setLevel = (l: AutonomyLevel) => setMandate((m) => ({ ...m, level: l }));
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
    <div className="w-full max-w-[44rem]">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.body}
      </StageHeading>

      {/* the level: three stops on one line */}
      <fieldset className="onb-rise mt-10" style={rise(2)}>
        <legend className="sr-only">Autonomy level</legend>
        <div className="onb-levels relative grid grid-cols-3" style={{ ["--at" as string]: index }}>
          <span aria-hidden="true" className="absolute left-[16.66%] right-[16.66%] top-[11px] h-px bg-white/10" />
          <span aria-hidden="true" className="onb-levels__fill absolute left-[16.66%] top-[11px] h-px bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-strong))]" />
          {policy.levels.map((l, i) => {
            const on = l.id === mandate.level;
            return (
              <label key={l.id} className="onb-level group relative flex cursor-pointer flex-col items-center text-center">
                <input type="radio" name="autonomy-level" value={l.id} checked={on} onChange={() => setLevel(l.id)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-[1] grid size-[23px] place-items-center rounded-full border bg-canvas transition-[border-color,box-shadow] duration-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg",
                    on ? "border-accent-strong shadow-[0_0_16px_-2px_var(--core-glow)]" : i < index ? "border-accent-line" : "border-white/15 group-hover:border-white/30",
                  )}
                >
                  <span className={cn("size-2 rounded-full transition-[background-color,transform] duration-500", on ? "scale-100 bg-accent-strong" : i < index ? "scale-75 bg-accent/70" : "scale-50 bg-white/20")} />
                </span>
                <span className={cn("mt-3.5 text-[15px] transition-colors duration-300", on ? "text-fg" : "text-fg-2 group-hover:text-fg")}>{l.name}</span>
                {l.id === policy.recommended && <span className="mt-1 text-[11.5px] text-accent-strong">Recommended</span>}
              </label>
            );
          })}
        </div>
        <p key={level.id} className="onb-word mx-auto mt-6 max-w-[30rem] text-center text-[15px] leading-relaxed text-fg-2" aria-live="polite">
          {level.summary}
        </p>
      </fieldset>

      {/* its consequence */}
      <div className="onb-rise mt-10 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2" style={rise(3)}>
        <Column title={copy.auto} items={auto.map((r) => r.label)} tone="auto" />
        <Column title={copy.ask} items={ask.map((r) => r.label)} tone="ask" />
      </div>
      {off.length > 0 && (
        <p className="onb-rise mt-3 text-[12.5px] text-fg-3">Turned off: {off.map((r) => r.label.toLowerCase()).join(", ")}.</p>
      )}

      <section aria-labelledby="never" className="onb-rise mt-8 rounded-xl border border-white/[0.07] px-5 py-4" style={rise(4)}>
        <h2 id="never" className="flex items-center gap-2 font-sans text-[13px] text-fg">
          <Lock className="size-3.5 text-fg-3" aria-hidden="true" />
          {copy.never}
        </h2>
        <ul className="mt-2.5 grid gap-x-6 gap-y-1.5 text-[13px] text-fg-3 sm:grid-cols-2">
          {policy.never.map((n) => (
            <li key={n} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.6em] h-px w-2 shrink-0 bg-white/25" />
              {n}
            </li>
          ))}
        </ul>
      </section>

      {/* action by action */}
      <div className="onb-rise mt-6" style={rise(5)}>
        <button
          type="button"
          onClick={() => setDetailed((d) => !d)}
          aria-expanded={detailed}
          aria-controls="autonomy-detail"
          className="inline-flex items-center gap-2 rounded-sm text-[13.5px] text-fg-2 transition-colors hover:text-fg"
        >
          {copy.adjust}
          {Object.keys(mandate.overrides).length > 0 && <span className="text-fg-3">· {Object.keys(mandate.overrides).length} adjusted</span>}
          <ChevronDown className={cn("size-4 transition-transform duration-300", detailed && "rotate-180")} aria-hidden="true" />
        </button>
        {detailed && (
          <div id="autonomy-detail" className="onb-rise mt-4">
            {(["understand", "prepare", "act"] as const).map((g) => (
              <section key={g} aria-labelledby={`grp-${g}`} className="mt-4 first:mt-0">
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
            {Object.keys(mandate.overrides).length > 0 && (
              <QuietButton className="mt-4" onClick={() => setMandate((m) => ({ ...m, overrides: {} }))}>
                Back to the {level.name} defaults
              </QuietButton>
            )}
          </div>
        )}
      </div>

      {error && (
        <Notice tone="error" className="mt-8">
          {error}
        </Notice>
      )}

      <div className="onb-rise mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" style={rise(6)}>
        <CoreButton onClick={() => onConfirm(mandate)} busy={saving}>
          {saving ? "Preparing your briefing" : `Confirm ${level.name.toLowerCase()} mode`}
        </CoreButton>
        <QuietButton onClick={onBack} disabled={saving}>
          Back to the analysis
        </QuietButton>
      </div>
      <p className="onb-rise mt-4 text-[12.5px] text-fg-3" style={rise(7)}>
        Every action Syxoria takes is logged, and you can change this mandate any time in Settings.
      </p>
    </div>
  );
}

function Column({ title, items, tone }: { title: string; items: string[]; tone: "auto" | "ask" }) {
  return (
    <div className="bg-canvas p-5">
      <h2 className="flex items-center gap-2.5 font-sans text-[13px] text-fg">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone === "auto" ? "bg-accent-strong" : "border border-fg-2")} />
        {title}
      </h2>
      <ul className="mt-3 grid gap-1.5">
        {items.map((i) => (
          <li key={i} className="onb-word text-[13.5px] leading-snug text-fg-2">
            {i}
          </li>
        ))}
        {items.length === 0 && <li className="text-[13.5px] text-fg-3">Nothing.</li>}
      </ul>
    </div>
  );
}

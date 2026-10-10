"use client";

import { ChevronLeft, ChevronRight, Columns3, Lock, SlidersHorizontal } from "lucide-react";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Sheet } from "@/components/home/sheet";
import { autonomy as copy } from "@/content/onboarding";
import { actingRules, effectiveMode, reachOf } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, AutonomyPolicy, Mandate, PermissionMode } from "@/types";
import { AutonomyCompare } from "./autonomy-compare";
import { AutonomyReach } from "./autonomy-reach";
import { AutonomyScenario } from "./autonomy-scenario";
import { AutonomySelector } from "./autonomy-selector";
import { MandateRing } from "./mandate-ring";
import { OnbButton } from "./onboarding-button";
import { PermissionControl } from "./permission-control";
import { Notice, QuietButton, rise, StageHeading } from "./primitives";

type Props = {
  policy: AutonomyPolicy;
  initial: Mandate | null;
  saving: boolean;
  error: string | null;
  /** Change this number to make the Core react once — it answers each mode it is offered */
  pulse: number;
  onLevel: (l: AutonomyLevel) => void;
  onConfirm: (m: Mandate) => void;
  onBack: () => void;
};

/**
 * The mandate — the moment the user decides how much freedom Syxoria gets, so everything on it
 * is there to reassure. One mode is looked at at a time, in one panel:
 *
 *   the way between the modes (names, arrows, a swipe)
 *   the mode itself — the Core inside the boundary being set (the ring), what the mode allows
 *   action by action, with the line where Syxoria starts asking, and one real situation played out
 *   what no mode ever allows
 *
 * Moving between modes moves the boundary rather than replacing the screen; the three can also be
 * laid side by side in the same place. Action-by-action control waits in a sheet.
 */
export function AutonomyStep({ policy, initial, saving, error, pulse, onLevel, onConfirm, onBack }: Props) {
  const [mandate, setMandate] = useState<Mandate>(initial ?? { level: policy.recommended, overrides: {} });
  const [detailed, setDetailed] = useState(false);
  const [comparing, setComparing] = useState(false);
  // which way the last change went — what belongs to the mode arrives from that side
  const [dir, setDir] = useState<"more" | "less">("more");
  const [focus, setFocus] = useState<number | null>(null);

  const index = policy.levels.findIndex((l) => l.id === mandate.level);
  const level = policy.levels[index];
  const less = policy.levels[index - 1];
  const more = policy.levels[index + 1];
  const rules = actingRules(policy);
  const modeOf = (id: string) => effectiveMode(policy.rules.find((r) => r.id === id)!, mandate);
  const reach = reachOf(policy, mandate);
  const adjusted = Object.keys(mandate.overrides).length;

  const setLevel = (l: AutonomyLevel) => {
    if (l === mandate.level) return;
    setDir(policy.levels.findIndex((x) => x.id === l) > index ? "more" : "less");
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

  // a swipe across the panel moves to the next mode, like turning a page
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: PointerEvent) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;
    const dx = e.clientX - from.x;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(e.clientY - from.y) * 1.5) return;
    const to = dx < 0 ? more : less;
    if (to) setLevel(to.id);
  };

  return (
    <div className="w-full max-w-[57rem]">
      <StageHeading lead={copy.title.lead} accent={copy.title.accent}>
        {copy.promise}
      </StageHeading>

      <section aria-label="Your mandate" className="onb-mandate onb-rise mt-6 tight:mt-4" style={{ ...rise(2), "--rows": rules.length } as CSSProperties} data-level={level.id} data-dir={dir} data-comparing={comparing || undefined}>
        {/* 1 — the choice: one mode at a time */}
        <div className="onb-mandate__bar">
          <AutonomySelector policy={policy} level={mandate.level} onChange={setLevel} />
          <div className="onb-mandate__tools">
            <button type="button" className="onb-mandate__step" disabled={!less} onClick={() => less && setLevel(less.id)} aria-label={less ? `${copy.less}: ${less.name}` : copy.less}>
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="onb-mandate__step" disabled={!more} onClick={() => more && setLevel(more.id)} aria-label={more ? `${copy.more}: ${more.name}` : copy.more}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="onb-mandate__compare" aria-pressed={comparing} onClick={() => setComparing((c) => !c)}>
              <Columns3 className="size-3.5" aria-hidden="true" />
              {comparing ? copy.compareClose : copy.compare}
            </button>
          </div>
        </div>

        <div className="onb-mandate__view" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (swipe.current = null)}>
          {/* the mode, as one image: the Core inside the boundary being set */}
          <div className="onb-mandate__figure">
            <MandateRing level={level.id} reach={reach} pulse={pulse} focus={focus} vtName="syx-core" />
            <div key={level.id} className="onb-turn" aria-live="polite">
              <p className="onb-mandate__promise">{copy.promises[level.id]}</p>
              <p className="mt-1.5 text-[12px] leading-snug text-fg-3">{copy.reach(reach.auto, reach.total)}</p>
            </div>
          </div>

          {comparing ? (
            <div className="onb-mandate__wide onb-rise">
              <AutonomyCompare policy={policy} mandate={mandate} onChoose={setLevel} />
            </div>
          ) : (
            <>
              {/* 2 — what it gives you: the mode in one sentence, then exactly where its reach ends */}
              <p key={level.id} className="onb-mandate__summary onb-turn">
                {level.summary}
              </p>
              <AutonomyReach rows={rules.map((r) => ({ id: r.id, label: r.label, mode: modeOf(r.id), locked: r.allowed.includes("auto") ? undefined : r.lockedReason }))} onFocus={setFocus} />
              {/* 3 — the chosen mode, played out on one real situation */}
              <div key={`s-${level.id}`} className="onb-turn">
                <AutonomyScenario subject={policy.scenarioSubject} level={level} />
              </div>
            </>
          )}
        </div>

        {/* whatever the mode */}
        <p className="onb-mandate__never">
          <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="text-fg-2">{copy.never}:</span> {policy.never.map((n) => n.toLowerCase()).join(" · ")}.
          </span>
        </p>
      </section>

      {error && (
        <Notice tone="error" className="mt-5">
          {error}
        </Notice>
      )}

      {/* 4 — the mandate */}
      <div className="onb-rise mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 tight:mt-4" style={rise(4)}>
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
        <p className="ml-auto hidden text-[12.5px] text-fg-3 xl:block">{copy.change}</p>
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

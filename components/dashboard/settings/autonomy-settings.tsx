"use client";

import Link from "next/link";
import { CirclePause, Lock, ShieldCheck } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { ModeGlyph } from "@/components/onboarding/mandate-ring";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { Button } from "@/components/ui/button";
import { automation as copy, holdTime } from "@/content/automation";
import { dailyBriefing as words } from "@/content/briefing";
import { globalHold, heldActions, holdFor } from "@/lib/automation";
import { cn } from "@/lib/cn";
import { effectiveMode, reachOfLevel } from "@/lib/onboarding/mandate";
import type { AutomationHold, AutonomyLevel, AutonomyPolicy, PermissionRule } from "@/types";
import { SettingsSection } from "./settings-section";

const GROUPS: PermissionRule["group"][] = ["understand", "prepare", "act"];
const WHERE: Record<string, string | undefined> = { Integrations: "/app/integrations", Security: "/app/settings?tab=security" };

/**
 * Settings & Autonomy, its first tab: the authority delegated to Syxoria and the controls over
 * it. The mode (compared, rule by rule, from the same policy as the onboarding), then the kill
 * switch, a pause for one workflow or one tool, the safety protection, and what each control does
 * and does not do. Every hold reads and writes the workspace's one automation state.
 */
export function AutonomySettings({ policy }: { policy: AutonomyPolicy }) {
  const { ctx } = useAutomation();
  const [compare, setCompare] = useState<AutonomyLevel>(ctx.level);
  const level = policy.levels.find((l) => l.id === compare) ?? policy.levels[0];

  return (
    <>
      <SettingsSection title={copy.settings.mode.title} description={copy.settings.mode.description}>
        <ModePicker policy={policy} current={ctx.level} value={compare} onChange={setCompare} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-fg-3">{copy.settings.mode.change}</p>
      </SettingsSection>

      <SettingsSection title={copy.settings.reach.title} description={copy.settings.reach.description(level.name)}>
        <Reach policy={policy} level={compare} />
      </SettingsSection>

      <KillSwitch />
      <Targeted />
      <Safety />

      <SettingsSection title={copy.settings.controls.title} description={copy.settings.controls.description}>
        <dl className="divide-y divide-line rounded-lg border border-line">
          {copy.settings.controls.items.map((c) => {
            const href = WHERE[c.where];
            return (
              <div key={c.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <dt className="text-[13px] text-fg">{c.name}</dt>
                <dd className="text-[13px] leading-snug text-fg-2">
                  {c.does}{" "}
                  {href ? (
                    <Link href={href} className="text-fg-3 underline decoration-white/20 underline-offset-2 hover:text-fg">
                      {c.where}
                    </Link>
                  ) : (
                    <span className="text-fg-3">{c.where}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </SettingsSection>
    </>
  );
}

/** The three modes, to compare: one radio group, the owner's own marked */
function ModePicker({ policy, current, value, onChange }: { policy: AutonomyPolicy; current: AutonomyLevel; value: AutonomyLevel; onChange: (l: AutonomyLevel) => void }) {
  const onKey = (e: KeyboardEvent) => {
    const go = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!go) return;
    e.preventDefault();
    const i = policy.levels.findIndex((l) => l.id === value);
    const next = policy.levels[(i + go + policy.levels.length) % policy.levels.length];
    onChange(next.id);
    document.getElementById(`mode-${next.id}`)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={copy.settings.mode.compare} className="grid gap-2 sm:grid-cols-3" onKeyDown={onKey}>
      {policy.levels.map((l) => {
        const reach = reachOfLevel(policy, l.id);
        const on = l.id === value;
        return (
          <button
            key={l.id}
            id={`mode-${l.id}`}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(l.id)}
            className={cn("ax-mode", on && "is-on")}
          >
            <span className="flex items-center gap-2">
              <ModeGlyph share={reach.total ? reach.auto / reach.total : 0} className="ax-mode__glyph" />
              <span className="ax-mode__name">{l.name}</span>
            </span>
            <span className="ax-mode__promise">{words.autonomy.promises[l.id]}</span>
            {l.id === current && <span className="ax-mode__current">{copy.settings.mode.current}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Rule by rule, under a mode: what Syxoria may observe, prepare and do, and what it never does */
function Reach({ policy, level }: { policy: AutonomyPolicy; level: AutonomyLevel }) {
  const { ctx } = useAutomation();
  return (
    <div className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g}>
          <p className="bd-label">{copy.settings.reach.groups[g]}</p>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {policy.rules
              .filter((r) => r.group === g)
              .map((r) => {
                const mode = effectiveMode(r, { level, overrides: {} });
                const fixed = r.allowed.length === 1 || Boolean(r.lockedReason);
                return (
                  <li key={r.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] text-fg">{r.label}</p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-fg-3">{r.description}</p>
                      {r.lockedReason && (
                        <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-fg-2">
                          <Lock aria-hidden="true" className="mt-0.5 size-3 shrink-0" strokeWidth={1.8} />
                          {r.lockedReason}
                        </p>
                      )}
                    </div>
                    <span className="ax-rule" data-mode={mode}>
                      {copy.settings.reach.modes[mode]}
                      {fixed && <span className="sr-only">, {copy.settings.reach.locked.toLowerCase()}</span>}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

      <div>
        <p className="bd-label">{copy.settings.reach.never}</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {policy.never.map((n) => (
            <li key={n} className="flex items-center gap-2 text-[13px] text-fg-2">
              <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-fg-3" strokeWidth={1.8} />
              {n}
            </li>
          ))}
        </ul>
      </div>

      {ctx.integrations.length > 0 && level === ctx.level && (
        <div>
          <p className="bd-label">{copy.settings.reach.tools}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ctx.integrations.map((i) => (
              <li key={i.id} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-[12.5px] text-fg-2">
                {i.logo && <IntegrationLogo id={i.logo} size={16} />}
                <span className="text-fg">{i.name}</span>
                {i.acts}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KillSwitch() {
  const { ctx, state, requestSuspend, requestResume } = useAutomation();
  const all = globalHold(state);
  const { held, running } = heldActions(state, ctx);
  return (
    <SettingsSection title={copy.settings.kill.title} description={copy.settings.kill.description}>
      <div className="ax-switch" data-held={all ? "" : undefined}>
        <SyxoriaCore state={all ? "paused" : "active"} detail="mark" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-fg">{all ? copy.settings.kill.suspended : copy.settings.kill.running}</p>
          <p className="mt-0.5 text-[12.5px] text-fg-3">
            {all
              ? `${copy.since(holdTime(all.since), all.by === "safety")}${all.reason ? `. ${all.reason}` : ""}. ${copy.banner.held(held.length)}.`
              : copy.settings.kill.nextUp(running.length)}
          </p>
        </div>
        {all ? (
          <Button variant="secondary" size="sm" onClick={() => requestResume(all)}>
            {copy.panel.review}
          </Button>
        ) : (
          <button type="button" onClick={requestSuspend} className="ax-kill ax-kill--inline">
            <CirclePause aria-hidden="true" strokeWidth={1.8} />
            {copy.panel.suspend}
          </button>
        )}
      </div>
      <p className="ax-preview">{copy.preview}</p>
    </SettingsSection>
  );
}

function Targeted() {
  const { ctx, state, pause, pausing, requestResume } = useAutomation();
  const all = globalHold(state);
  const row = (id: string, hold: AutomationHold | null, scope: "workflow" | "integration") => {
    const covered = !hold && all;
    return (
      <div className="flex shrink-0 items-center gap-3">
        <span className="ax-run" data-state={hold ? "paused" : covered ? "held" : "running"}>
          {hold ? copy.settings.targeted.paused : covered ? copy.settings.targeted.coveredByGlobal : copy.settings.targeted.running}
        </span>
        {hold ? (
          <Button variant="ghost" size="sm" onClick={() => requestResume(hold)}>
            {copy.settings.targeted.resume}
          </Button>
        ) : (
          <Button variant="outline" size="sm" loading={pausing === id} onClick={() => pause(scope, id)}>
            {copy.settings.targeted.pause}
          </Button>
        )}
      </div>
    );
  };

  return (
    <SettingsSection title={copy.settings.targeted.title} description={copy.settings.targeted.description}>
      {ctx.workflows.length === 0 ? (
        <p className="text-[13px] text-fg-3">{copy.settings.targeted.none}</p>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="bd-label">{copy.settings.targeted.workflows}</p>
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {ctx.workflows.map((w) => {
                const tool = ctx.integrations.find((i) => i.id === w.integrationId);
                return (
                  <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1 basis-64">
                      <p className="text-[13px] text-fg">{w.name}</p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-fg-3">
                        {w.description}
                        {tool && <> {copy.settings.targeted.inTool(tool.name)}.</>}
                      </p>
                    </div>
                    {row(w.id, holdFor(state, "workflow", w.id), "workflow")}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="bd-label">{copy.settings.targeted.tools}</p>
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {ctx.integrations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {i.logo ? <IntegrationLogo id={i.logo} size={18} /> : <span aria-hidden="true" className="size-[18px] rounded-xs border border-line" />}
                    <div className="min-w-0">
                      <p className="text-[13px] text-fg">{i.name}</p>
                      <p className="mt-0.5 text-[12.5px] text-fg-3">{i.acts}</p>
                    </div>
                  </div>
                  {row(i.id, holdFor(state, "integration", i.id), "integration")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

function Safety() {
  const { state } = useAutomation();
  const incident = state.incident;
  return (
    <SettingsSection title={copy.settings.safety.title} description={copy.settings.safety.description}>
      {incident ? (
        <div className="ax-switch" data-held="">
          <CirclePause aria-hidden="true" className="size-5 shrink-0 text-negative" strokeWidth={1.7} />
          <div className="min-w-0">
            <p className="text-[14px] text-fg">{incident.reason}</p>
            <p className="mt-0.5 text-[12.5px] text-fg-3">
              {copy.settings.safety.held}: {incident.held.join(", ")}
            </p>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-fg-2">
          <ShieldCheck aria-hidden="true" className="size-4 text-accent-strong" strokeWidth={1.8} />
          {copy.settings.safety.none}
        </p>
      )}
    </SettingsSection>
  );
}

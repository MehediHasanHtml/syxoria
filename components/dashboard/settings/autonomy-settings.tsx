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
import type { ApprovalRequirement, OperationalLimit, SafetyStop } from "@/types/workspace";

export type SafetySettings = { approvals: ApprovalRequirement[]; limits: OperationalLimit[]; restricted: string[]; stops: SafetyStop[] };
import { SettingsSection } from "./settings-section";

const GROUPS: PermissionRule["group"][] = ["understand", "prepare", "act"];
const WHERE: Record<string, string | undefined> = { Integrations: "/app/integrations", Security: "/app/settings?tab=security" };

/**
 * Settings & Autonomy, its first tab: the authority delegated to Syxoria and the controls over
 * it. The mode (compared, rule by rule, from the same policy as the onboarding), then the kill
 * switch, a pause for one workflow or one tool, the safety protection, and what each control does
 * and does not do. Every hold reads and writes the workspace's one automation state.
 */
export function AutonomySettings({ policy, safety }: { policy: AutonomyPolicy; safety: SafetySettings }) {
  const { ctx } = useAutomation();
  const [compare, setCompare] = useState<AutonomyLevel>(ctx.level);
  const [switched, setSwitched] = useState<string | null>(null);
  const level = policy.levels.find((l) => l.id === compare) ?? policy.levels[0];

  return (
    <>
      <SettingsSection title={copy.settings.mode.title} description={copy.settings.mode.description}>
        <ModePicker policy={policy} current={ctx.level} value={compare} onChange={setCompare} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {compare !== ctx.level && (
            <Button size="sm" variant="secondary" onClick={() => setSwitched(`Preview: in the product, ${level.name} applies from the next action, and Syxoria tells you what changed.`)}>
              Switch to {level.name}
            </Button>
          )}
          <p className="text-[12.5px] leading-relaxed text-fg-3">{switched ?? "Your mode was set during onboarding. Compare the others, and switch when you are ready."}</p>
        </div>
      </SettingsSection>

      <SettingsSection title={copy.settings.reach.title} description={copy.settings.reach.description(level.name)}>
        <Reach policy={policy} level={compare} />
      </SettingsSection>

      <SettingsSection title="Approval requirements" description="What waits for your approval under each mode. Some actions always wait, whatever the mode.">
        <div className="ws-table-wrap">
          <table className="ws-table ax-matrix">
            <thead>
              <tr>
                <th scope="col">Action</th>
                {(["guided", "assisted", "autonomous"] as const).map((m) => (
                  <th key={m} scope="col" data-current={m === ctx.level || undefined}>
                    {policy.levels.find((l) => l.id === m)?.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safety.approvals.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="ws-cell-title">{a.action}</span>
                    {a.locked && (
                      <span className="ws-cell-sub">
                        <Lock aria-hidden="true" className="mr-1 inline size-3" strokeWidth={1.8} />
                        {a.locked}
                      </span>
                    )}
                  </td>
                  {(["guided", "assisted", "autonomous"] as const).map((m) => (
                    <td key={m} data-current={m === ctx.level || undefined} data-label={policy.levels.find((l) => l.id === m)?.name}>
                      <span className="ax-rule" data-mode={a[m]}>
                        {copy.settings.reach.modes[a[m]]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      <SettingsSection title="Operational and financial limits" description="The boundaries Syxoria works within, even in Autonomous mode. Anything beyond them waits for you.">
        <ul className="divide-y divide-line rounded-lg border border-line">
          {safety.limits.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-[13px] text-fg">{l.label}</span>
                <span className="block text-[12.5px] text-fg-3">{l.detail}</span>
              </span>
              <span className="ax-limit tabular">{l.value}</span>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title="Sensitive and restricted actions" description="Never done by Syxoria, in any mode, whatever the instruction.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {safety.restricted.map((r) => (
            <li key={r} className="ax-restricted">
              <ShieldCheck aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <KillSwitch />
      <Targeted />
      <Safety stops={safety.stops} />

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
        <div className="ax-switch__text">
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

function Safety({ stops }: { stops: SafetySettings["stops"] }) {
  const { state } = useAutomation();
  const incident = state.incident;
  return (
    <SettingsSection title={copy.settings.safety.title} description={copy.settings.safety.description}>
      <ul className="ax-rules-list">
        {["Messages bounce or are rejected", "An unusual volume of actions in a few minutes", "A tool returns errors repeatedly", "An amount above your limits appears in a draft"].map((r) => (
          <li key={r}>
            <ShieldCheck aria-hidden="true" />
            {r}
          </li>
        ))}
      </ul>
      <p className="mt-3 mb-4 text-[12.5px] text-fg-3">When one of these happens, only the work concerned is held. Syxoria says what was held, what was already on its way, and what must happen before it resumes.</p>
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
          No incident in progress.
        </p>
      )}
      <p className="bd-label mt-5">Recent safety stops</p>
      <ul className="mt-2 grid gap-2">
        {stops.map((s) => (
          <li key={s.id} className="ax-stop">
            <p className="ax-stop__head">
              <span>{s.reason}</span>
              <span className="ws-cell-sub">{s.at}</span>
            </p>
            <dl className="ax-stop__facts">
              <div>
                <dt>Held</dt>
                <dd>{s.held}</dd>
              </div>
              <div>
                <dt>Already on its way</dt>
                <dd>{s.inFlight}</dd>
              </div>
              <div>
                <dt>To resume</dt>
                <dd>{s.resolved}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}

"use client";

import { Lock } from "lucide-react";
import { autonomy as copy } from "@/content/onboarding";
import { actingRules, effectiveMode, reachOfLevel } from "@/lib/onboarding/mandate";
import type { AutonomyLevel, AutonomyPolicy, Mandate, PermissionMode } from "@/types";
import { ModeGlyph } from "./mandate-ring";

const said: Record<PermissionMode, string> = { auto: copy.auto, ask: copy.ask, off: copy.off };

/**
 * The three modes side by side — the same actions, in the same order, one column per mode. The
 * emerald steps down from left to right as the autonomy grows, and stops: the last rows are the
 * user's in every column. A column's heading chooses that mode.
 * Styles: "Mandate" in globals.css.
 */
export function AutonomyCompare({ policy, mandate, onChoose }: { policy: AutonomyPolicy; mandate: Mandate; onChoose: (l: AutonomyLevel) => void }) {
  const rules = actingRules(policy);
  return (
    <div className="onb-compare">
      <table>
        <caption className="sr-only">What Syxoria does on its own, and what it asks first, under each mode</caption>
        <thead>
          <tr>
            <td />
            {policy.levels.map((l) => {
              const reach = reachOfLevel(policy, l.id);
              const on = l.id === mandate.level;
              return (
                <th key={l.id} scope="col" data-on={on || undefined}>
                  <button type="button" className="onb-compare__mode" aria-pressed={on} onClick={() => onChoose(l.id)}>
                    <ModeGlyph share={reach.auto / reach.total} />
                    {l.name}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <span className="onb-compare__label">
                  <span className="truncate">{r.label}</span>
                  {!r.allowed.includes("auto") && <Lock className="size-3 shrink-0 text-fg-3" aria-hidden="true" />}
                </span>
              </th>
              {policy.levels.map((l) => {
                // the chosen mode as the user has it (with their adjustments); the others as they come
                const mode = l.id === mandate.level ? effectiveMode(r, mandate) : r.defaults[l.id];
                return (
                  <td key={l.id} data-on={l.id === mandate.level || undefined}>
                    <span aria-hidden="true" className="onb-mark" data-mode={mode} />
                    <span className="sr-only">{said[mode]}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="onb-compare__key">
        <span>
          <span aria-hidden="true" className="onb-mark" data-mode="auto" />
          {copy.auto}
        </span>
        <span>
          <span aria-hidden="true" className="onb-mark" data-mode="ask" />
          {copy.ask}
        </span>
        <span>
          <Lock className="size-3" aria-hidden="true" />
          {copy.always}
        </span>
      </p>
    </div>
  );
}

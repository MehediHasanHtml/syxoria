"use client";

import { Lock } from "lucide-react";
import { useId } from "react";
import { autonomy as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import type { Mandate, PermissionMode, PermissionRule } from "@/types";

/** What a rule does under a mandate: the user's choice for it, else the level's default */
export function effectiveMode(rule: PermissionRule, mandate: Mandate): PermissionMode {
  const chosen = mandate.overrides[rule.id];
  return chosen && rule.allowed.includes(chosen) ? chosen : rule.defaults[mandate.level];
}

/**
 * One action the system may take, and how: automatically, after asking, or not at all.
 * Native radios, so arrows move between modes; modes a rule can never have are simply absent,
 * and a locked rule says why.
 */
export function PermissionControl({ rule, mode, onChange }: { rule: PermissionRule; mode: PermissionMode; onChange: (mode: PermissionMode) => void }) {
  const id = useId();
  const locked = rule.allowed.length === 1;
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p id={`${id}-l`} className="flex items-center gap-2 text-[14px] text-fg">
          {rule.label}
          {rule.lockedReason && <Lock className="size-3 text-fg-3" aria-hidden="true" />}
        </p>
        <p id={`${id}-d`} className="mt-1 text-[13px] leading-snug text-fg-3">
          {rule.description}
          {rule.lockedReason && <span className="block text-fg-2">{rule.lockedReason}</span>}
        </p>
      </div>
      {locked ? (
        <p className="shrink-0 text-[13px] text-fg-2">{copy.modes[rule.allowed[0]]}</p>
      ) : (
        <div role="radiogroup" aria-labelledby={`${id}-l`} aria-describedby={`${id}-d`} className="onb-segment shrink-0 self-start sm:self-auto">
          {(["auto", "ask", "off"] as const)
            .filter((m) => rule.allowed.includes(m))
            .map((m) => (
              <label key={m} className={cn("onb-segment__item", mode === m && "onb-segment__item--on")} data-mode={m}>
                <input type="radio" name={id} value={m} checked={mode === m} onChange={() => onChange(m)} className="sr-only" />
                {copy.modes[m]}
              </label>
            ))}
        </div>
      )}
    </div>
  );
}

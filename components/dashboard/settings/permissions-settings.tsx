"use client";

import Link from "next/link";
import { useState } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import type { WorkspaceTool } from "@/types/workspace";
import { SettingsSection } from "./settings-section";

type Level = "read" | "write" | "off";
const LEVELS: { id: Level; label: string }[] = [
  { id: "read", label: "Read" },
  { id: "write", label: "Act" },
  { id: "off", label: "Off" },
];

/**
 * Connected tool permissions: tool by tool, what Syxoria may read, what it may do, and what is off.
 * Sensitive permissions (moving money, deleting, sending new messages) can only be off.
 */
export function PermissionsSettings({ tools }: { tools: WorkspaceTool[] }) {
  const connected = tools.filter((t) => t.permissions);
  const [levels, setLevels] = useState<Record<string, Level>>(() => Object.fromEntries(connected.flatMap((t) => (t.permissions ?? []).map((p) => [`${t.id}:${p.label}`, p.level]))));
  const locked = (label: string) => /move money|delete|new messages|invite|create invoices/i.test(label);

  return (
    <SettingsSection title="Connected tool permissions" description="For each tool, what Syxoria may read, what it may do, and what stays off. Sensitive permissions stay off.">
      <div className="grid gap-3">
        {connected.map((t) => (
          <section key={t.id} className="rounded-lg border border-line">
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="ws-tool__logo" aria-hidden="true">
                {t.logo ? <IntegrationLogo id={t.logo} size={18} /> : <span>{t.name.charAt(0)}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-fg">{t.name}</span>
                <span className="block text-[12px] text-fg-3">{t.account}</span>
              </span>
              <Link href={`/app/integrations?tool=${t.id}`} className="ws-link">
                Open
              </Link>
            </header>
            <ul className="divide-y divide-line">
              {(t.permissions ?? []).map((p) => {
                const key = `${t.id}:${p.label}`;
                const isLocked = locked(p.label);
                return (
                  <li key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-[13px] text-fg-2">
                      {p.label}
                      {isLocked && <span className="ml-2 text-[11.5px] text-fg-3">Always off</span>}
                    </span>
                    <div role="radiogroup" aria-label={p.label} className="ws-seg ws-seg--sm">
                      {LEVELS.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={levels[key] === l.id}
                          disabled={isLocked && l.id !== "off"}
                          onClick={() => setLevels((s) => ({ ...s, [key]: l.id }))}
                          className="ws-seg__item"
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="ax-preview">Preview: changes apply on this screen only.</p>
    </SettingsSection>
  );
}

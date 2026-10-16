"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { AppShell, type ShellContext } from "@/components/dashboard/app-shell";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { effectiveMode } from "@/lib/onboarding/mandate";
import type { AutonomyPolicy, Briefing, CompanyProfile, DataSource, Mandate, OnboardingSnapshot } from "@/types";
import { FirstBriefing } from "./first-briefing";

type Props = {
  shell: ShellContext;
  snapshot: OnboardingSnapshot & { company: CompanyProfile; briefing: Briefing; mandate: Mandate };
  sources: DataSource[];
  policy: AutonomyPolicy;
};

/**
 * The last moment: the briefing doesn't hand over to "the app" — the app arrives around it.
 * The product's sidebar and top bar slide in (styles: "ARRIVAL" in globals.css), the briefing
 * stays as the workspace's first page, and the Core is now simply at work. The address becomes
 * /app, so the next visit lands straight here.
 */
export function TransitionToSaaS({ shell, snapshot, sources, policy }: Props) {
  const { company, briefing, mandate, session, connections } = snapshot;
  const connected = sources.filter((s) => connections[s.id]?.status === "connected");
  const level = policy.levels.find((l) => l.id === mandate.level)!;
  const asks = policy.rules.filter((r) => r.group === "act" && effectiveMode(r, mandate) === "ask");

  useEffect(() => {
    window.history.replaceState(null, "", "/app");
    document.title = "Overview · Syxoria";
  }, []);

  const firstName = session?.firstName ?? null;
  const ctx: ShellContext = {
    ...shell,
    // the workspace is the company the user just confirmed, and the account the one they just made
    workspace: { ...shell.workspace, name: company.name },
    user: session
      ? {
          ...shell.user,
          email: session.email,
          name: firstName ?? session.email.split("@")[0],
          initials: (firstName ?? session.email).slice(0, 2).toUpperCase(),
        }
      : shell.user,
  };

  return (
    <div data-arrival="">
      <AppShell {...ctx}>
        {/* on a desktop, the whole page is one screen: the briefing takes what the strip leaves it */}
        <div className="arrival-fit">
          <div className="arrival-fit__main">
            <FirstBriefing briefing={briefing} mandate={mandate} policy={policy} sources={connected} firstName={firstName} variant="workspace" />
          </div>

          <section aria-label="Your Syxoria" className="arrival-late arrival-fit__strip mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line @3xl:grid-cols-3">
            <div className="flex min-w-0 items-center gap-4 bg-canvas-2 px-5 py-4">
              <SyxoriaCore state="executing" detail="mark" className="size-9" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-fg-3">Active</p>
                <p className="mt-1 truncate text-[13px] text-fg-2" title={`Syxoria keeps reading new activity at ${company.name} and updates this briefing every morning.`}>
                  Updated every morning
                </p>
              </div>
              <Link href="/app/insights" className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg">
                Insights <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="flex min-w-0 items-center bg-canvas-2 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-fg-3">Sources · read only</p>
                {/* one line: the logos alone where the names would not fit */}
                <ul className="mt-1 flex items-center gap-x-3 overflow-hidden 2xl:gap-x-4">
                  {connected.map((s) => (
                    <li key={s.id} title={s.name} className="flex shrink-0 items-center gap-2 text-[13px] text-fg-2">
                      {s.logo && <IntegrationLogo id={s.logo} size={14} />}
                      <span className={s.logo ? "sr-only 2xl:not-sr-only" : undefined}>{s.name}</span>
                      <span className="sr-only">, connected</span>
                    </li>
                  ))}
                </ul>
              </div>
              <span aria-hidden="true" className="ml-auto size-1.5 shrink-0 rounded-full bg-accent" />
            </div>
            <div className="flex min-w-0 items-center gap-4 bg-canvas-2 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-fg-3">Mandate</p>
                <p className="mt-1 truncate text-[13px] text-fg-2" title={`Asks you before: ${asks.map((r) => r.label.toLowerCase()).join(", ")}.`}>
                  <span className="text-fg">{level.name}</span> · asks you before {asks.length} {asks.length === 1 ? "action" : "actions"}
                </p>
              </div>
              <Link href="/app/settings?tab=workspace" className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg">
                Change <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    </div>
  );
}

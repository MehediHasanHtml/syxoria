"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { AppShell, type ShellContext } from "@/components/dashboard/app-shell";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import type { AutonomyPolicy, Briefing, CompanyProfile, DataSource, Mandate, OnboardingSnapshot } from "@/types";
import { CoreMark } from "./core-mark";
import { FirstBriefing } from "./first-briefing";
import { effectiveMode } from "./permission-control";

type Props = {
  shell: ShellContext;
  snapshot: OnboardingSnapshot & { company: CompanyProfile; briefing: Briefing; mandate: Mandate };
  sources: DataSource[];
  policy: AutonomyPolicy;
};

/**
 * The last moment: the briefing doesn't hand over to "the app" — the app arrives around it.
 * The product's sidebar and top bar slide in (styles: "ARRIVAL" in globals.css), the
 * briefing stays as the workspace's first page, and what the system learned stays in view.
 * The address becomes /app, so the next visit lands straight here.
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
        <FirstBriefing briefing={briefing} mandate={mandate} policy={policy} firstName={firstName} variant="workspace" />

        <section aria-label="Your system" className="arrival-late mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line @3xl:grid-cols-3">
          <div className="bg-canvas-2 p-5">
            <p className="text-[11px] font-medium text-fg-3">Sources · read-only</p>
            <ul className="mt-3 grid gap-2">
              {connected.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5 text-[13px] text-fg-2">
                  {s.logo && <IntegrationLogo id={s.logo} size={14} />}
                  {s.name}
                  <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-accent" />
                  <span className="sr-only">connected</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-canvas-2 p-5">
            <p className="text-[11px] font-medium text-fg-3">Mandate</p>
            <p className="mt-3 text-[14px] text-fg">{level.name}</p>
            <p className="mt-1 text-[13px] leading-snug text-fg-3">Asks you before: {asks.map((r) => r.label.toLowerCase()).join(", ")}.</p>
            <Link href="/app/settings?tab=workspace" className="mt-3 inline-flex items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg">
              Change <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex items-start gap-4 bg-canvas-2 p-5">
            <CoreMark level={7} className="size-10 shrink-0" />
            <div>
              <p className="text-[11px] font-medium text-fg-3">Still learning</p>
              <p className="mt-3 text-[13px] leading-snug text-fg-2">
                Syxoria keeps reading new activity at {company.name} and will update this briefing every morning.
              </p>
              <Link href="/app/insights" className="mt-3 inline-flex items-center gap-1 text-xs text-fg-2 transition-colors hover:text-fg">
                All insights <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </AppShell>
    </div>
  );
}

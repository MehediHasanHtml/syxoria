"use client";

import { useCallback, useReducer, useState } from "react";
import { flushSync } from "react-dom";
import type { ShellContext } from "@/components/dashboard/app-shell";
import { stageNames } from "@/content/onboarding";
import { connectedIds, emptySnapshot, onboardingReducer, systemProgress, type OnboardingAction } from "@/lib/onboarding/machine";
import { getFirstBriefing, saveMandate } from "@/services/onboarding";
import type { AutonomyPolicy, DataSource, Mandate, OnboardingSnapshot, OnboardingStage } from "@/types";
import { AccountStep } from "./account-step";
import { AnalysisReveal } from "./analysis-reveal";
import { AutonomySettings } from "./autonomy-settings";
import { CompanyIdentification } from "./company-identification";
import { FirstBriefing } from "./first-briefing";
import { IntegrationConnection } from "./integration-connection";
import { MemoryPanel, MemoryStrip } from "./memory-panel";
import { OnboardingShell, type ShellLayout } from "./onboarding-shell";
import { TransitionToSaaS } from "./transition-to-saas";
import { UnderstandingState } from "./understanding-state";

type Props = {
  sources: DataSource[];
  policy: AutonomyPolicy;
  shell: ShellContext;
  /** Where to start: a fresh account, or progress the backend says this account already made */
  resume: OnboardingSnapshot | null;
  mode: "create" | "signin";
  plan: string | null;
};

const layouts: Record<Exclude<OnboardingStage, "complete">, ShellLayout> = {
  account: "focus",
  company: "split",
  connections: "split",
  syncing: "split",
  analysis: "split",
  autonomy: "split",
  briefing: "briefing",
};

/**
 * Moves from one moment to the next as one continuous change: where the browser supports
 * View Transitions, the old and new states morph (the memory panel, the conversation, the
 * briefing's title are shared elements — "ONBOARDING" in globals.css); elsewhere the new
 * moment simply rises in.
 */
function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go = () => {
    update();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (!doc.startViewTransition || reduced) {
    go();
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = "onboarding";
  doc.startViewTransition(() => flushSync(go)).finished.finally(() => delete root.dataset.vt);
}

/**
 * The onboarding: one environment that gets richer as the system learns the company —
 * account, company, sources, understanding, analysis, autonomy, briefing — and then becomes
 * the workspace. Every moment reads and writes one state (lib/onboarding/machine.ts).
 */
export function OnboardingExperience({ sources, policy, shell, resume, mode, plan }: Props) {
  const [state, dispatch] = useReducer(onboardingReducer, resume ?? emptySnapshot);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** stage changes go through a transition; everything else updates in place */
  const move = useCallback((action: OnboardingAction) => transition(() => dispatch(action)), []);

  const progress = systemProgress(state);
  const level = Math.min(7, (state.session ? 1 : 0) + progress.lit - 1);
  const connected = sources.filter((s) => connectedIds(state).includes(s.id));

  async function confirmMandate(mandate: Mandate) {
    setSaving(true);
    setSaveError(null);
    try {
      const [saved, briefing] = await Promise.all([saveMandate(mandate), getFirstBriefing(connected)]);
      move({ type: "mandated", mandate: saved, briefing });
    } catch {
      setSaveError("Your choices couldn’t be saved just now. Nothing changed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (state.stage === "complete" && state.company && state.briefing && state.mandate) {
    return <TransitionToSaaS shell={shell} snapshot={{ ...state, company: state.company, briefing: state.briefing, mandate: state.mandate }} sources={sources} policy={policy} />;
  }

  const stage = state.stage === "complete" ? "briefing" : state.stage;
  const memoryProps = { snapshot: state, sources, policy };

  return (
    <OnboardingShell
      layout={layouts[stage]}
      awake={level / 7}
      bar={{ states: progress.states, word: progress.word, level, working: stage === "syncing", email: state.session?.email ?? null }}
      announcement={`${stageNames[stage]}. The system is ${progress.word.toLowerCase()}.`}
      memory={<MemoryPanel {...memoryProps} />}
      strip={<MemoryStrip {...memoryProps} />}
    >
      {stage === "account" && <AccountStep initialMode={mode} plan={plan} onAuthenticated={(session) => move({ type: "authenticated", session })} />}

      {stage === "company" && (
        <CompanyIdentification
          welcome={state.session?.returning ? `Welcome back${state.session.firstName ? `, ${state.session.firstName}` : ""}` : null}
          onConfirmed={(company) => move({ type: "companyConfirmed", company })}
        />
      )}

      {stage === "connections" && (
        <IntegrationConnection
          company={state.company}
          sources={sources}
          connections={state.connections}
          onChange={(id, connection) => dispatch({ type: "connection", id, connection })}
          onContinue={() => move({ type: "go", stage: "syncing" })}
          onBack={() => move({ type: "go", stage: "company" })}
        />
      )}

      {stage === "syncing" && state.company && (
        <UnderstandingState
          company={state.company}
          sources={connected}
          found={state.found}
          level={level}
          onFound={(kind, count) => dispatch({ type: "found", kind, count })}
          onUnderstood={(knowledge) => dispatch({ type: "understood", knowledge })}
          onAnalysed={(analysis) => move({ type: "analysed", analysis })}
        />
      )}

      {stage === "analysis" && state.analysis && (
        <AnalysisReveal analysis={state.analysis} company={state.company?.name ?? "your company"} onContinue={() => move({ type: "go", stage: "autonomy" })} />
      )}

      {stage === "autonomy" && (
        <AutonomySettings policy={policy} initial={state.mandate} saving={saving} error={saveError} onConfirm={confirmMandate} onBack={() => move({ type: "go", stage: "analysis" })} />
      )}

      {stage === "briefing" && state.briefing && state.mandate && (
        <FirstBriefing
          briefing={state.briefing}
          mandate={state.mandate}
          policy={policy}
          firstName={state.session?.firstName ?? null}
          variant="onboarding"
          onEnter={() => move({ type: "go", stage: "complete" })}
        />
      )}
    </OnboardingShell>
  );
}
